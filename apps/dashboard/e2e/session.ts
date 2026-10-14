import { encode } from "next-auth/jwt";
import type { BrowserContext } from "@playwright/test";

/**
 * Session cookie factory for the E2E suite.
 *
 * The panel is gated on the server (`getServerSession`), so mocking the
 * browser's network is not enough: the tests need a real, encrypted session
 * cookie. This mints one with the same `NEXTAUTH_SECRET` the server was started
 * with, which keeps the suite free of both a database and a login round-trip.
 *
 * Start the app server with these two variables set, and run Playwright from an
 * environment that has the same `NEXTAUTH_SECRET`:
 *
 *   $env:NEXTAUTH_SECRET="e2e-secret"; $env:NEXTAUTH_URL="http://localhost:3111"
 *   npm run build; npm run start -- --port 3111
 *   npm run test:e2e
 *
 * `NEXTAUTH_URL` must be the http URL: when NextAuth believes the site is on
 * https it names the cookie `__Secure-next-auth.session-token`, and Chrome
 * refuses `__Secure-` cookies over http.
 */
export const SESSION_COOKIE = "next-auth.session-token";

export interface E2ESession {
  id?: string;
  email: string;
  role: string;
  tenantId?: string | null;
  isStaff?: boolean;
}

export async function signInAs(context: BrowserContext, session: E2ESession): Promise<void> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      "NEXTAUTH_SECRET is not set. Export the same value you started the app server with (see the header of e2e/session.ts).",
    );
  }

  const value = await encode({
    token: {
      sub: session.id ?? "e2e-user",
      email: session.email,
      role: session.role,
      tenantId: session.tenantId ?? null,
      isStaff: session.isStaff ?? false,
    },
    secret,
    maxAge: 60 * 60,
  });

  await context.addCookies([
    {
      name: SESSION_COOKIE,
      value,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}
