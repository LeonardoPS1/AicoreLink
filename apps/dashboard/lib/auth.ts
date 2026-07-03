import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";

/**
 * NOTA IMPORTANTE (Fase 0):
 * Este proveedor asume, por simplicidad inicial, que cada usuario esta
 * asociado a UN SOLO tenant (caso normal: el dueno/administrativo de una
 * clinica). El modelo de datos (tabla tenant_users) ya soporta que un
 * usuario tenga varios tenants -si en el futuro Aicore Agency gestiona
 * varias clinicas desde una sola cuenta, se debe agregar un paso de
 * "seleccionar tenant activo" tras el login. No implementado aun.
 */
export const authOptions: NextAuthOptions = {
  secret: process.env.AICORELINK_NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: { tenantLinks: { include: { tenant: true } } },
        });

        if (!user || !user.passwordHash) return null;

        const validPassword = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!validPassword) return null;

        const primaryLink = user.tenantLinks[0];
        if (!primaryLink) return null; // usuario sin tenant asociado: no puede entrar

        return {
          id: user.id,
          email: user.email,
          tenantId: primaryLink.tenantId,
          role: primaryLink.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.tenantId = (user as any).tenantId;
        token.role = (user as any).role;
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
