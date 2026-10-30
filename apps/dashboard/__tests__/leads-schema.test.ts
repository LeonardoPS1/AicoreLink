import { describe, it, expect } from "vitest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getModel(name: string) {
  return (prisma as any)._runtimeDataModel.models[name];
}

describe("Leads & Appointments schema", () => {
  it("Lead model exists with CRUD", () => {
    expect(prisma.lead).toBeDefined();
    expect(typeof prisma.lead.create).toBe("function");
    expect(typeof prisma.lead.findUnique).toBe("function");
    expect(typeof prisma.lead.findMany).toBe("function");
    expect(typeof prisma.lead.update).toBe("function");
    expect(typeof prisma.lead.delete).toBe("function");
  });

  it("Appointment model exists with CRUD", () => {
    expect(prisma.appointment).toBeDefined();
    expect(typeof prisma.appointment.create).toBe("function");
    expect(typeof prisma.appointment.findUnique).toBe("function");
    expect(typeof prisma.appointment.findMany).toBe("function");
    expect(typeof prisma.appointment.update).toBe("function");
    expect(typeof prisma.appointment.delete).toBe("function");
  });

  it("Lead has utmSource/utmMedium/utmCampaign fields", () => {
    const model = getModel("Lead");
    expect(model).toBeDefined();
    const fieldNames = model.fields.map((f: any) => f.name);
    expect(fieldNames).toContain("utmSource");
    expect(fieldNames).toContain("utmMedium");
    expect(fieldNames).toContain("utmCampaign");
  });
});
