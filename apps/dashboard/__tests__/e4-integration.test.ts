import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => {
  const leads: any[] = [];
  const appointments: any[] = [];
  const tx = {
    lead: { findMany: vi.fn(), create: vi.fn() },
    appointment: { findMany: vi.fn(), create: vi.fn() },
    tenantUsage: { findMany: vi.fn(), findFirst: vi.fn() },
    tenant: { findUnique: vi.fn(), findFirst: vi.fn() },
  };
  const withTenant = vi.fn();
  const getServerSession = vi.fn();
  return { leads, appointments, tx, withTenant, getServerSession };
});

vi.mock("@/lib/tenant-context", () => ({
  withTenant: h.withTenant,
  asAdmin: vi.fn(async (fn: any) => fn(h.tx)),
}));

vi.mock("@/lib/db", () => ({ db: { tenant: { findUnique: vi.fn() } } }));

vi.mock("next-auth", () => ({
  getServerSession: h.getServerSession,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

import { NextRequest } from "next/server";
import { GET as leadsGET, POST as leadsPOST } from "@/app/api/tenants/leads/route";
import { GET as apptsGET, POST as apptsPOST } from "@/app/api/tenants/appointments/route";
import { GET as usageGET } from "@/app/api/tenants/usage/route";
import { checkMarginAlert } from "@/lib/panel/margin-alerts";

function makeReq(url: string, body?: unknown, method = "GET") {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function session(role: string, tenantId?: string) {
  return { user: { id: "u1", role, tenantId } };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.leads.length = 0;
  h.appointments.length = 0;
  h.withTenant.mockImplementation(async (_t: string, fn: (tx: any) => unknown) => fn(h.tx));
  h.tx.lead.findMany.mockImplementation(async (args?: any) => {
    let res = [...h.leads];
    if (args?.where?.status) res = res.filter((l) => l.status === args.where.status);
    return res;
  });
  h.tx.lead.create.mockImplementation(async (args: any) => {
    const lead = { id: `l${h.leads.length + 1}`, ...args.data, createdAt: new Date() };
    h.leads.push(lead);
    return lead;
  });
  h.tx.appointment.findMany.mockImplementation(async (args?: any) => {
    let res = [...h.appointments];
    if (args?.where?.scheduledAt?.gte) {
      res = res.filter((a) => new Date(a.scheduledAt) >= args.where.scheduledAt.gte);
    }
    if (args?.where?.scheduledAt?.lte) {
      res = res.filter((a) => new Date(a.scheduledAt) <= args.where.scheduledAt.lte);
    }
    return res;
  });
  h.tx.appointment.create.mockImplementation(async (args: any) => {
    const appt = { id: `a${h.appointments.length + 1}`, ...args.data, createdAt: new Date() };
    h.appointments.push(appt);
    return appt;
  });
  h.tx.tenantUsage.findMany.mockResolvedValue([
    {
      messagesIn: 10,
      messagesOut: 5,
      tokensUsed: 100,
      costEstimate: 1.5,
      model: "mistral",
      version: "v1",
      period: new Date("2026-10-01T00:00:00.000Z"),
    },
  ]);
  h.tx.tenant.findUnique.mockResolvedValue({ plan: "starter" });
  h.tx.tenant.findFirst.mockResolvedValue({ plan: "starter" });
  h.getServerSession.mockResolvedValue(session("cliente", "t1"));
});

describe("E4 integration", () => {
  it("creates a lead with UTM and verifies it in leads API", async () => {
    const postRes = await leadsPOST(
      makeReq("http://localhost/api/tenants/leads", { name: "Juan", source: "web", utmSource: "google" }, "POST")
    );
    expect(postRes.status).toBe(201);
    const created = await postRes.json();
    expect(created.lead).toMatchObject({ tenantId: "t1", name: "Juan", utmSource: "google" });

    const getRes = await leadsGET(makeReq("http://localhost/api/tenants/leads"));
    expect(getRes.status).toBe(200);
    const body = await getRes.json();
    expect(body.leads).toHaveLength(1);
    expect(body.leads[0].utmSource).toBe("google");
  });

  it("creates an appointment and verifies it in appointments API", async () => {
    const postRes = await apptsPOST(
      makeReq("http://localhost/api/tenants/appointments", { scheduledAt: "2026-10-15T10:00:00.000Z", notes: "nota" }, "POST")
    );
    expect(postRes.status).toBe(201);
    const created = await postRes.json();
    expect(created.appointment ?? created).toBeTruthy();

    const getRes = await apptsGET(makeReq("http://localhost/api/tenants/appointments"));
    expect(getRes.status).toBe(200);
    const body = await getRes.json();
    expect(body.appointments).toHaveLength(1);
    expect(body.appointments[0]).toMatchObject({ tenantId: "t1", status: "pendiente", notes: "nota" });
  });

  it("returns correct margin from usage API", async () => {
    const res = await usageGET(makeReq("http://localhost/api/tenants/usage?period=2026-10"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.usage.messagesIn).toBe(10);
    expect(body.usage.costEstimate).toBe(1.5);
    expect(body.margin.cost).toBe(1.5);
    expect(body.margin.revenue).toBe(19990);
    expect(body.margin.marginPct).toBeCloseTo(((19990 - 1.5) / 19990) * 100);
  });

  it("triggers margin alert when margin below threshold", async () => {
    h.tx.tenantUsage.findMany.mockResolvedValue([
      { costEstimate: 19000, period: new Date("2026-10-01T00:00:00.000Z") },
    ]);
    const r = await checkMarginAlert("t1", "2026-10");
    expect(r.alert).toBe(true);
    expect(r.threshold).toBe(20);
  });
});