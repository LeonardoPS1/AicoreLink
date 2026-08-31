import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyTOTP, generateSecret } from "@/lib/totp";
import { db } from "@/lib/db";

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