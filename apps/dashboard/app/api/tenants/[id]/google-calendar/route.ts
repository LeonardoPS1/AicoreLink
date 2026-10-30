import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Google Calendar OAuth + sync endpoint
// POST: Save Google Calendar credentials (tokens)
// GET: Check connection status

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const tenant = await db.tenant.findUnique({
    where: { id: params.id },
    select: { id: true, name: true },
  });
  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });

  // Check if google calendar integration exists via channel credentials
  const cred = await db.channelCredential.findFirst({
    where: { tenantId: params.id, channel: "google_calendar", provider: "google" },
  });

  return NextResponse.json({
    connected: !!cred,
    calendarId: (cred as any)?.externalId ?? null,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { accessToken, refreshToken, calendarId } = body;

  if (!accessToken) {
    return NextResponse.json({ error: "accessToken requerido" }, { status: 400 });
  }

  await db.channelCredential.upsert({
    where: { id: `${params.id}-google_calendar` },
    update: {
      encryptedSecret: JSON.stringify({ accessToken, refreshToken }),
      externalId: calendarId ?? "primary",
      enabled: true,
    },
    create: {
      id: `${params.id}-google_calendar`,
      tenantId: params.id,
      channel: "google_calendar",
      provider: "google",
      encryptedSecret: JSON.stringify({ accessToken, refreshToken }),
      externalId: calendarId ?? "primary",
      enabled: true,
    },
  });

  return NextResponse.json({ ok: true, message: "Google Calendar conectado" });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await db.channelCredential.deleteMany({
    where: { tenantId: params.id, channel: "google_calendar" },
  });
  return NextResponse.json({ ok: true, message: "Google Calendar desconectado" });
}