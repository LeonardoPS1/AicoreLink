import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { generatePilotReport } from "@/lib/pilots/report";

export async function GET() {
  const session = await getServerSession(authOptions);
  try {
    requireRole(session?.user as any, ["dev_aicore"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const report = await generatePilotReport();
    return NextResponse.json(report);
  } catch (error) {
    console.error("[pilots report GET] Error:", error);
    return NextResponse.json({ error: "Error al generar reporte" }, { status: 500 });
  }
}