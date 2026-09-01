import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const providers = {};
  for (const provider of authOptions.providers) {
    if (provider.type === "credentials") {
      (providers as any)[provider.id] = {
        name: provider.name,
        type: "credentials",
        credentials: provider.credentials,
      };
    } else {
      (providers as any)[provider.id] = {
        name: provider.name,
        type: provider.type,
        signinUrl: `${new URL(request.url).origin}/api/auth/signin/${provider.id}`,
        callbackUrl: `${new URL(request.url).origin}/api/auth/callback/${provider.id}`,
      };
    }
  }
  return NextResponse.json(providers);
}