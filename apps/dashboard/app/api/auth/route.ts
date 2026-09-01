import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

/**
 * Endpoint GET: Verificar sesión activa y retornar datos de usuario
 * 
 * Usa la sesión de NextAuth ya validada (JWT, RLS, multi-tenant).
 * Retorna userId, tenantId y role desde la sesión JWT.
 */
export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as {
      user: { id: string; email?: string; name?: string; image?: string; tenantId: string; role: string };
    };

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Sin sesión activa" }, { status: 401 });
    }

    const userId = session.user.id;
    const tenantId = session.user.tenantId;
    const role = session.user.role;

    // Retornar información de sesión verificada
    return NextResponse.json({
      userId,
      tenantId,
      role,
      authenticated: true,
    });
  } catch (error) {
    console.error("[session] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

/**
 * Endpoint POST: Callback de credenciales para login
 * 
 * Maneja el flujo de login con CredentialsProvider.
 * Valida email/password, crea sesión JWT y redirige.
 * 
 * Este endpoint reemplaza el need para un route.ts separado en
 * callback/credentials para evitar conflictos de routing con NextAuth.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const email = body.get("email") as string;
    const password = body.get("password") as string;
    const callbackUrl = (body.get("callbackUrl") as string) || "/whatsapp";

    if (!email || !password) {
      return NextResponse.redirect(new URL(`/login?error=CredentialsSignin`, request.url));
    }

    // Buscar usuario por email
    const user = await db.user.findUnique({
      where: { email: email },
      include: { tenantLinks: { include: { tenant: true } } },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.redirect(new URL(`/login?error=CredentialsSignin`, request.url));
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return NextResponse.redirect(new URL(`/login?error=CredentialsSignin`, request.url));
    }

    // Seleccionar el primer tenantLink como activo
    const primaryLink = user.tenantLinks[0];
    if (!primaryLink) {
      return NextResponse.redirect(new URL(`/login?error=CredentialsSignin`, request.url));
    }

    // Crear token JWT
    const secret = new TextEncoder().encode(process.env.AICORELINK_NEXTAUTH_SECRET);
    const token = await new SignJWT({
      name: user.email,
      email: user.email,
      sub: user.id,
      tenantId: primaryLink.tenantId,
      role: primaryLink.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(secret);

    // Respuesta con cookie de sesión y redirección
    const response = NextResponse.redirect(new URL(callbackUrl, request.url));
    response.cookies.set("next-auth.session-token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("[auth] Error during credentials POST:", error);
    return NextResponse.redirect(new URL(`/login?error=CredentialsSignin`, request.url));
  }
}