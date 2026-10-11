import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";

declare module "next-auth" {
  interface NextAuthOptions {
    csrf?: boolean;
  }
}

/**
 * Multi-tenant auth support:
 * - Users can belong to multiple tenants via tenantLinks
 * - After login, the first tenantLink is set as active by default
 * - JWT stores the active tenantId; session callback propagates it
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

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("[auth] Missing credentials");
          return null;
        }

        try {
          console.log("[auth] Looking up user:", credentials.email);
          const user = await db.user.findUnique({
            where: { email: credentials.email },
            include: { tenantLinks: { include: { tenant: true } } },
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

          // Seleccionar el primer tenantLink como activo por defecto
          const primaryLink = user.tenantLinks[0];
          if (!primaryLink) {
            console.log("[auth] No tenant links for user:", user.id);
            return null;
          }

          console.log("[auth] Login successful for:", user.email, "tenant:", primaryLink.tenantId);
          return {
            id: user.id,
            email: user.email,
            tenantId: primaryLink.tenantId,
            role: primaryLink.role,
            // flag para indicar si el usuario tiene múltiples tenants
            multiTenant: user.tenantLinks.length > 1,
          };
        } catch (error) {
          console.error("[auth] Database error during authorize:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.tenantId = (user as any).tenantId;
        token.role = (user as any).role;
        token.multiTenant = (user as any).multiTenant ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
};