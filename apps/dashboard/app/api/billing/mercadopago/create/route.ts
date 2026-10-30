import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/billing/mercadopago/create
 * Creates a Mercado Pago payment preference for a tenant billing.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, amount, description } = body;

    if (!tenantId || !amount) {
      return NextResponse.json({ error: "tenantId and amount required" }, { status: 400 });
    }

    const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ error: "Mercado Pago not configured" }, { status: 500 });
    }

    // Create payment preference via Mercado Pago API
    const preference = {
      items: [
        {
          title: description || `Factura AicoreLink - ${tenant.name}`,
          quantity: 1,
          unit_price: Number(amount),
          currency_id: "CLP",
        },
      ],
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/billing?status=success`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/billing?status=failure`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/billing?status=pending`,
      },
      auto_return: "approved",
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/mercadopago`,
      external_reference: tenantId,
    };

    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preference),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[mercadopago] Error creating preference:", err);
      return NextResponse.json({ error: "Error creating payment" }, { status: 500 });
    }

    const data = await res.json();

    // Save billing record
    const billing = await db.tenantBilling.create({
      data: {
        tenantId,
        plan: "pro",
        amount: Number(amount),
        currency: "CLP",
        status: "pending",
        invoiceUrl: data.init_point,
      },
    });

    return NextResponse.json({
      billingId: billing.id,
      paymentUrl: data.init_point,
      preferenceId: data.id,
    });
  } catch (error) {
    console.error("[mercadopago] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
