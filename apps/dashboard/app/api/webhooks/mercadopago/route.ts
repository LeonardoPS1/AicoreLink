import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Mercado Pago webhook - handles payment notifications
// POST: Process payment notification

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, data } = body;

  if (type !== "payment") {
    return NextResponse.json({ ok: true, message: "Ignored non-payment notification" });
  }

  const paymentId = data?.id;
  if (!paymentId) {
    return NextResponse.json({ error: "payment id missing" }, { status: 400 });
  }

  // TODO: Verify payment with Mercado Pago API
  // GET https://api.mercadopago.com/v1/payments/{paymentId}
  // with Authorization: Bearer {ACCESS_TOKEN}

  // For now, log the notification
  // In production, this would update TenantBilling status

  return NextResponse.json({
    ok: true,
    message: "Payment notification received",
    paymentId,
  });
}

export async function GET(req: NextRequest) {
  // Mercado Pago webhook verification
  return NextResponse.json({ status: "ok", service: "mercadopago-webhook" });
}