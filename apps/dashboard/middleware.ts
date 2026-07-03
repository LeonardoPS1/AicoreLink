import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Bloquea el panel admin a cualquiera que no sea dev_aicore.
    if (pathname.startsWith("/tenants") && token?.role !== "dev_aicore") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Bloquea rutas de cliente si la sesion no tiene tenantId asociado.
    const clienteRoutes = ["/dashboard", "/whatsapp", "/email", "/rrss"];
    if (clienteRoutes.some((r) => pathname.startsWith(r)) && !token?.tenantId) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/whatsapp/:path*", "/email/:path*", "/rrss/:path*", "/tenants/:path*"],
};
