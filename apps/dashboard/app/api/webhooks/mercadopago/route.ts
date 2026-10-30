import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Mercado Pago webhook - handles payment notifications
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;

    if (type !== "payment") {
      return NextResponse.json({ ok: true, message: "Ignored non-payment notification" });
    }

    const paymentId = data?.id;
    if (!paymentId) {
      return NextResponse.json({ error: "payment id missing" }, { status: 400 });
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ error: "Mercado Pago not configured" }, { status: 500 });
    }

    // Verify payment with Mercado Pago API
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const payment = await res.json();
    const tenantId = payment.external_reference;
    const status = payment.status; // approved, pending, rejected, etc.

    // Update billing record
    if (tenantId) {
      const billing = await db.tenantBilling.findFirst({
        where: { tenantId, invoiceUrl: { contains: paymentId } },
      });

      if (billing) {
        await db.tenantBilling.update({
          where: { id: billing.id },
          data: {
            status: status === "approved" ? "paid" : status === "rejected" ? "failed" : "pending",
            lastPaymentAt: status === "approved" ? new Date() : null,
          },
        });
      }
    }

    return NextResponse.json({ ok: true, status });
  } catch (error) {
    console.error("[mercadopago webhook] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "mercadopago-webhook" });
}
