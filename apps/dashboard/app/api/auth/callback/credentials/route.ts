import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.formData();
  const email = body.get("email") as string;
  const password = body.get("password") as string;
  const callbackUrl = (body.get("callbackUrl") as string) || "/whatsapp";

  if (!email || !password) {
    return NextResponse.redirect(new URL(`/login?error=CredentialsSignin`, request.url));
  }

  const credentialsProvider = authOptions.providers.find(
    (p) => p.id === "credentials" || p.name === "Credenciales"
  ) as any;

  if (!credentialsProvider?.authorize) {
    return NextResponse.redirect(new URL(`/login?error=Configuration`, request.url));
  }

  const user = await credentialsProvider.authorize({ email, password });

  if (!user) {
    return NextResponse.redirect(new URL(`/login?error=CredentialsSignin`, request.url));
  }

  const secret = new TextEncoder().encode(process.env.AICORELINK_NEXTAUTH_SECRET);
  const token = await new SignJWT({
    name: user.email,
    email: user.email,
    sub: user.id,
    tenantId: (user as any).tenantId,
    role: (user as any).role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  const response = NextResponse.redirect(new URL(callbackUrl, request.url));
  response.cookies.set("next-auth.session-token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
} 
