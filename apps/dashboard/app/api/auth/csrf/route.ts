import { NextRequest, NextResponse } from "next/server";
import { getCsrfToken } from "next-auth/react";

export async function GET(request: NextRequest) {
  const csrfToken = await getCsrfToken({ req: request });
  return NextResponse.json({ csrfToken });
}