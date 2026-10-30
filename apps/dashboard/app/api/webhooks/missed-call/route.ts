import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Missed call → WhatsApp notification
// When a call is missed, send a WhatsApp message to the caller

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const callSid = formData.get("CallSid")?.toString() ?? "";
  const from = formData.get("From")?.toString() ?? "";
  const to = formData.get("To")?.toString() ?? "";
  const callStatus = formData.get("CallStatus")?.toString() ?? "";

  if (callStatus !== "no-answer" && callStatus !== "busy" && callStatus !== "failed") {
    return NextResponse.json({ ok: true, message: "Not a missed call" });
  }

  // Find tenant by phone
  const cred = await db.channelCredential.findFirst({
    where: { externalId: to, channel: "whatsapp_text" },
  });
  const tenantId = cred?.tenantId;

  if (!tenantId) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  // Get tenant name
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });

  // Log the missed call
  await db.auditLog.create({
    data: {
      tenantId,
      action: "missed_call",
      meta: { callSid, from, to, callStatus },
    },
  });

  // TODO: Send WhatsApp message via Twilio
  // This would typically be done via n8n webhook or direct Twilio API call
  // For now, we log the intent and let n8n handle the actual message sending

  return NextResponse.json({
    ok: true,
    message: "Missed call logged",
    tenant: tenant?.name,
    caller: from,
    action: "send_whatsapp",
  });
}