import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const instagramWebhookSchema = z.object({
  entry: z.array(z.object({
    messaging: z.array(z.object({
      sender: z.object({ id: z.string() }),
      recipient: z.object({ id: z.string() }),
      timestamp: z.number(),
      message: z.object({ text: z.string().optional() }).optional(),
    })).optional(),
  })).optional(),
});

/**
 * POST /api/webhooks/instagram
 * Handles Instagram DM webhooks (Meta Graph API).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verify webhook (Meta sends a challenge for GET)
    const mode = req.nextUrl.searchParams.get("hub.mode");
    if (mode === "subscribe") {
      const challenge = req.nextUrl.searchParams.get("hub.challenge");
      return new NextResponse(challenge, { status: 200 });
    }

    // Process incoming DMs
    const entries = body.entry || [];
    for (const entry of entries) {
      const messaging = entry.messaging || [];
      for (const msg of messaging) {
        const senderId = msg.sender?.id;
        const text = msg.message?.text;
        if (!senderId || !text) continue;

        // Log the message as a conversation
        // In production, resolve tenant from Instagram page ID and create conversation
        console.log(`[instagram] DM from ${senderId}: ${text}`);
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[instagram-webhook] Error:", error);
    return NextResponse.json({ error: "Error processing webhook" }, { status: 500 });
  }
}

/**
 * GET /api/webhooks/instagram
 * Webhook verification for Meta.
 */
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  const verifyToken = process.env.INSTAGRAM_VERIFY_TOKEN || "aicorelink-verify";

  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}