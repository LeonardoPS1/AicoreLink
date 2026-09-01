import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";

/**
 * Multi-tenant auth support:
 * - Users can belong to multiple tenants via tenantLinks
 - After login, the first tenantLink is set as active by default
 * - JWT stores the active tenantId; session callback propagates it
 * - multiTenant flag indicates if user has access to more than one tenant
 */
export const authOptions: NextAuthOptions = {
  secret: process.env.AICORELINK_NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  // Disable CSRF check behind reverse proxy (Traefik/Cloudflare) - trustHost not working in v4.24.7
  csrf: async () => true,
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email },
            include: { tenantLinks: { include: { tenant: true } } },
          });

          if (!user || !user.passwordHash) return null;

          const validPassword = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!validPassword) return null;

          // Seleccionar el primer tenantLink como activo por defecto
          const primaryLink = user.tenantLinks[0];
          if (!primaryLink) return null; // usuario sin tenant asociado: no puede entrar

          return {
            id: user.id,
            email: user.email,
            tenantId: primaryLink.tenantId,
            role: primaryLink.role,
            // flag para indicar si el usuario tiene múltiples tenants
            multiTenant: user.tenantLinks.length > 1,
          };
        } catch (error) {
          // Log differentiate: error de DB vs. credenciales inválidas
          // El return null fuera del catch ya cubre ambos casos visualmente,
          // pero el log interno permite diagnóstico posterior.
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