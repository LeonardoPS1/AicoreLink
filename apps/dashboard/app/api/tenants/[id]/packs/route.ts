import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Packs by rubro - predefined service packs for different business types
const PACKS: Record<string, { name: string; services: string[]; price: number }[]> = {
  clinica: [
    { name: "Pack Básico", services: ["Agenda online", "WhatsApp automático", "Recordatorios"], price: 29900 },
    { name: "Pack Pro", services: ["Agenda online", "WhatsApp automático", "Recordatorios", "Asistente IA", "Reportes"], price: 59900 },
    { name: "Pack Premium", services: ["Todo lo anterior", "Multi-sede", "Voz", "CRM"], price: 99900 },
  ],
  gimnasio: [
    { name: "Pack Básico", services: ["Reservas de clases", "WhatsApp automático", "Recordatorios"], price: 29900 },
    { name: "Pack Pro", services: ["Reservas", "WhatsApp", "Asistente IA", "Control de asistencia"], price: 59900 },
    { name: "Pack Premium", services: ["Todo lo anterior", "Multi-sede", "Pagos online", "CRM"], price: 99900 },
  ],
  salon: [
    { name: "Pack Básico", services: ["Agenda online", "WhatsApp automático", "Recordatorios"], price: 24900 },
    { name: "Pack Pro", services: ["Agenda", "WhatsApp", "Asistente IA", "Galería de trabajos"], price: 49900 },
    { name: "Pack Premium", services: ["Todo lo anterior", "Multi-profesional", "Pagos online"], price: 79900 },
  ],
  veterinaria: [
    { name: "Pack Básico", services: ["Agenda online", "WhatsApp automático", "Recordatorios de vacunas"], price: 29900 },
    { name: "Pack Pro", services: ["Agenda", "WhatsApp", "Asistente IA", "Historial de mascotas"], price: 59900 },
    { name: "Pack Premium", services: ["Todo lo anterior", "Multi-sede", "Telemedicina"], price: 99900 },
  ],
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const tenant = await db.tenant.findUnique({
    where: { id: params.id },
    include: { businessProfiles: true },
  });

  const rubro = tenant?.businessProfiles?.[0]?.rubro ?? "clinica";
  const packs = PACKS[rubro] ?? PACKS.clinica;

  return NextResponse.json({ rubro, packs });
}