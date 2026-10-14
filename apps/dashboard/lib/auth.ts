import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { isStaffRole } from "./rbac";

declare module "next-auth" {
  interface NextAuthOptions {
    csrf?: boolean;
  }
}

/** Usuario que la sesión lleva en el JWT. `tenantId` es null para el staff de Aicore. */
export interface AuthorizedUser {
  id: string;
  email: string;
  tenantId: string | null;
  role: string;
  isStaff: boolean;
  multiTenant: boolean;
}

/**
 * Autoriza email + contraseña y devuelve el usuario que va al JWT.
 *
 * - El staff de Aicore (`User.staffRole`) es global: entra sin ningún tenantLink.
 * - Un usuario común entra por su tenantLink más antiguo (orden explícito: no
 *   puede depender del orden en que la base devuelva las filas).
 * - Cualquier otro caso devuelve null.
 *
 * Está exportada y fuera del provider a propósito: el objeto que devuelve
 * `CredentialsProvider()` es un envoltorio de next-auth, así que la única forma
 * de probar esta lógica sin depender de sus tripas es llamarla directo.
 */
export async function authorizeCredentials(
  credentials: { email?: string | null; password?: string | null } | undefined | null,
): Promise<AuthorizedUser | null> {
  if (!credentials?.email || !credentials?.password) {
    console.log("[auth] Missing credentials");
    return null;
  }

  try {
    console.log("[auth] Looking up user:", credentials.email);
    const user = await db.user.findUnique({
      where: { email: credentials.email },
      include: {
        tenantLinks: {
          include: { tenant: true },
          // Orden explicito: el link activo por defecto tiene que ser estable
          // (un dueno con dos negocios no puede entrar a uno u otro al azar).
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!user) {
      console.log("[auth] User not found:", credentials.email);
      return null;
    }

    console.log("[auth] User found:", user.id, "hasPasswordHash:", !!user.passwordHash);

    if (!user.passwordHash) {
      console.log("[auth] No password hash for user:", user.id);
      return null;
    }

    console.log("[auth] Comparing password...");
    const validPassword = await bcrypt.compare(credentials.password, user.passwordHash);
    console.log("[auth] Password valid:", validPassword);

    if (!validPassword) {
      console.log("[auth] Password mismatch for user:", user.id);
      return null;
    }

    // El staff de Aicore es global (no tiene tenant por definición); un
    // usuario común entra por su tenantLink más antiguo.
    const primaryLink = user.tenantLinks[0];
    const staff = isStaffRole(user.staffRole);

    if (!staff && !primaryLink) {
      console.log("[auth] No tenant links and not staff:", user.id);
      return null;
    }

    console.log("[auth] Login successful for:", user.email, "staff:", staff);
    return {
      id: user.id,
      email: user.email,
      // tenantId puede ser null para el staff: no lo convertir a undefined.
      tenantId: primaryLink?.tenantId ?? null,
      role: staff ? (user.staffRole as string) : "cliente",
      isStaff: staff,
      // flag para indicar si el usuario tiene múltiples tenants
      multiTenant: user.tenantLinks.length > 1,
    };
  } catch (error) {
    console.error("[auth] Database error during authorize:", error);
    return null;
  }
}

/**
 * Multi-tenant auth support:
 * - Users can belong to multiple tenants via tenantLinks
 * - After login, the oldest tenantLink is set as active by default
 * - JWT stores the active tenantId (null for Aicore staff); the session callback propagates it
 * - multiTenant flag indicates if user has access to more than one tenant
 */
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  // Disable CSRF check behind reverse proxy (Traefik/Cloudflare)
  csrf: false,
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },

      authorize: authorizeCredentials,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.tenantId = (user as any).tenantId;
        token.role = (user as any).role;
        token.isStaff = (user as any).isStaff ?? false;
        token.multiTenant = (user as any).multiTenant ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).role = token.role;
        (session.user as any).isStaff = token.isStaff;
      }
      return session;
    },
  },
};