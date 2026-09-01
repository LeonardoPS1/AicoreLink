import { NextRequest, NextResponse } from "next/server";
import { getCsrfToken } from "next-auth/react";

export async function GET(request: Request) {
  const csrfToken = await getCsrfToken({ req: request as any });
  return NextResponse.json({ csrfToken });
}