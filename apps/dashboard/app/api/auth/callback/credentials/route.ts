import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.formData();
  const email = body.get("email") as string;
  const password = body.get("password") as string;

  if (!email || !password) {
    return NextResponse.redirect(new URL("/login?error=CredentialsSignin", request.url));
  }

  const credentialsProvider = authOptions.providers.find(
    (p) => p.id === "credentials" || p.name === "Credenciales"
  ) as any;

  if (!credentialsProvider?.authorize) {
    return NextResponse.redirect(new URL("/login?error=Configuration", request.url));
  }

  const user = await credentialsProvider.authorize({ email, password });

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=CredentialsSignin", request.url));
  }

  const token = await getToken({
    req: request,
    secret: process.env.AICORELINK_NEXTAUTH_SECRET,
    raw: true,
  });

  const response = NextResponse.redirect(new URL("/whatsapp", request.url));

  if (token) {
    response.cookies.set("next-auth.session-token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}