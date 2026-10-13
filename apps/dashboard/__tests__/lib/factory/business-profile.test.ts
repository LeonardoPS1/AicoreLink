import { describe, expect, it, beforeEach, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

// Mock the tenant-context to avoid real DB connections
vi.mock("@/lib/tenant-context", () => ({
  withTenant: vi.fn(async (tenantId: string, fn: any) => {
    if (!tenantId) {
      throw new Error("withTenant() requiere un tenantId valido");
    }
    return fn(mockTx);
  }),
}));

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: vi.fn(async (fn: any) => fn(mockTx)),
    businessProfile: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    site: {
      create: vi.fn(),
    },
    siteTemplate: {
      findUnique: vi.fn(),
    },
  },
}));

import { withTenant } from "@/lib/tenant-context";
import { db } from "@/lib/db";
import {
  BusinessProfileInput,
  RubroEnum,
  PhoneSchema,
  createBusinessProfile,
  getBusinessProfile,
  updateBusinessProfile,
  type BusinessProfileCreateInput,
  type BusinessProfileUpdateInput,
} from "@/lib/factory/business-profile";

const mockTx = {
  businessProfile: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  site: {
    create: vi.fn(),
  },
  siteTemplate: {
    findUnique: vi.fn(),
  },
};

describe("BusinessProfile Zod schema", () => {
  const validBaseInput = {
    rubro: "barberia" as const,
    name: "Barbería El Corte",
    slug: "barberia-el-corte",
    phone: "+56912345678",
    email: "contacto@barberiaelcorte.cl",
    address: "Av. Principal 123, Santiago",
    description: "La mejor barbería de la ciudad",
    logoUrl: "https://example.com/logo.png",
    images: ["https://example.com/img1.jpg", "https://example.com/img2.jpg"],
    hours: {
      lunes: { open: "09:00", close: "19:00" },
      martes: { open: "09:00", close: "19:00" },
      miercoles: { open: "09:00", close: "19:00" },
      jueves: { open: "09:00", close: "19:00" },
      viernes: { open: "09:00", close: "19:00" },
      sabado: { open: "09:00", close: "14:00" },
      domingo: { open: "", close: "" },
    },
    team: [
      { name: "Juan Pérez", role: "Barbero", bio: "10 años de experiencia", photoUrl: "https://example.com/juan.jpg" },
    ],
    services: [
      { name: "Corte clásico", description: "Corte de pelo tradicional", priceCLP: 15000, durationMin: 30 },
    ],
    faqs: [
      { question: "¿Atienden domingo?", answer: "Solo hasta las 14:00" },
    ],
    social: {
      instagram: "https://instagram.com/barberiaelcorte",
      facebook: "https://facebook.com/barberiaelcorte",
    },
  };

  it("accepts a valid input with all fields", () => {
    const result = BusinessProfileInput.safeParse(validBaseInput);
    expect(result.success).toBe(true);
  });

  it("accepts minimal required fields only", () => {
    const minimal = {
      rubro: "taller" as const,
      name: "Taller Mecánico",
      slug: "taller-mecanico",
    };
    const result = BusinessProfileInput.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.images).toEqual([]);
      expect(result.data.team).toEqual([]);
      expect(result.data.services).toEqual([]);
      expect(result.data.faqs).toEqual([]);
      expect(result.data.hours).toEqual({});
      expect(result.data.social).toEqual({});
    }
  });

  it("rejects invalid rubro", () => {
    const result = BusinessProfileInput.safeParse({ ...validBaseInput, rubro: "invalido" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid rubro values", () => {
    const rubros = ["barberia", "taller", "profesional", "clinica", "inmobiliaria", "domicilio"] as const;
    for (const rubro of rubros) {
      const result = BusinessProfileInput.safeParse({ ...validBaseInput, rubro });
      expect(result.success).toBe(true);
    }
  });

  it("rejects name too short", () => {
    const result = BusinessProfileInput.safeParse({ ...validBaseInput, name: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects name too long", () => {
    const result = BusinessProfileInput.safeParse({ ...validBaseInput, name: "A".repeat(121) });
    expect(result.success).toBe(false);
  });

  it("rejects slug with uppercase", () => {
    const result = BusinessProfileInput.safeParse({ ...validBaseInput, slug: "Mi-Slug" });
    expect(result.success).toBe(false);
  });

  it("rejects slug with special chars", () => {
    const result = BusinessProfileInput.safeParse({ ...validBaseInput, slug: "mi_slug!" });
    expect(result.success).toBe(false);
  });

  it("accepts valid slug format", () => {
    const result = BusinessProfileInput.safeParse({ ...validBaseInput, slug: "mi-negocio-123" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid phone format", () => {
    const result = BusinessProfileInput.safeParse({ ...validBaseInput, phone: "+5691234567" });
    expect(result.success).toBe(false);
  });

  it("rejects phone without +569 prefix", () => {
    const result = BusinessProfileInput.safeParse({ ...validBaseInput, phone: "912345678" });
    expect(result.success).toBe(false);
  });

  it("accepts valid Chilean phone format", () => {
    const result = BusinessProfileInput.safeParse({ ...validBaseInput, phone: "+56912345678" });
    expect(result.success).toBe(true);
  });

  it("phone is optional", () => {
    const { phone, ...withoutPhone } = validBaseInput;
    const result = BusinessProfileInput.safeParse(withoutPhone);
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = BusinessProfileInput.safeParse({ ...validBaseInput, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects address too long", () => {
    const result = BusinessProfileInput.safeParse({ ...validBaseInput, address: "A".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects description too long", () => {
    const result = BusinessProfileInput.safeParse({ ...validBaseInput, description: "A".repeat(2001) });
    expect(result.success).toBe(false);
  });

  it("rejects invalid logoUrl", () => {
    const result = BusinessProfileInput.safeParse({ ...validBaseInput, logoUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects images array over 10 items", () => {
    const result = BusinessProfileInput.safeParse({
      ...validBaseInput,
      images: Array(11).fill("https://example.com/img.jpg"),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid image URL in array", () => {
    const result = BusinessProfileInput.safeParse({
      ...validBaseInput,
      images: ["https://valid.com/img.jpg", "not-a-url"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects team array over 20 items", () => {
    const result = BusinessProfileInput.safeParse({
      ...validBaseInput,
      team: Array(21).fill({ name: "Test", role: "Role" }),
    });
    expect(result.success).toBe(false);
  });

  it("rejects team member without name", () => {
    const result = BusinessProfileInput.safeParse({
      ...validBaseInput,
      team: [{ role: "Barbero" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects services array over 50 items", () => {
    const result = BusinessProfileInput.safeParse({
      ...validBaseInput,
      services: Array(51).fill({ name: "Servicio" }),
    });
    expect(result.success).toBe(false);
  });

  it("rejects service with negative price", () => {
    const result = BusinessProfileInput.safeParse({
      ...validBaseInput,
      services: [{ name: "Servicio", priceCLP: -100 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects service with non-integer price", () => {
    const result = BusinessProfileInput.safeParse({
      ...validBaseInput,
      services: [{ name: "Servicio", priceCLP: 100.5 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects faqs array over 20 items", () => {
    const result = BusinessProfileInput.safeParse({
      ...validBaseInput,
      faqs: Array(21).fill({ question: "Q", answer: "A" }),
    });
    expect(result.success).toBe(false);
  });

  it("rejects FAQ without question", () => {
    const result = BusinessProfileInput.safeParse({
      ...validBaseInput,
      faqs: [{ answer: "A" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid social URLs", () => {
    const result = BusinessProfileInput.safeParse({
      ...validBaseInput,
      social: { instagram: "not-a-url" },
    });
    expect(result.success).toBe(false);
  });
});

describe("PhoneSchema", () => {
  it("accepts valid +569XXXXXXXX format", () => {
    expect(PhoneSchema.safeParse("+56912345678").success).toBe(true);
  });

  it("rejects short number", () => {
    expect(PhoneSchema.safeParse("+5691234567").success).toBe(false);
  });

  it("rejects long number", () => {
    expect(PhoneSchema.safeParse("+569123456789").success).toBe(false);
  });

  it("rejects missing +569", () => {
    expect(PhoneSchema.safeParse("912345678").success).toBe(false);
  });

  it("rejects non-numeric chars", () => {
    expect(PhoneSchema.safeParse("+5691234567a").success).toBe(false);
  });
});

describe("RubroEnum", () => {
  it("contains exactly 6 values", () => {
    expect(RubroEnum.options.length).toBe(6);
    expect(RubroEnum.options).toEqual([
      "barberia",
      "taller",
      "profesional",
      "clinica",
      "inmobiliaria",
      "domicilio",
    ]);
  });
});

describe("createBusinessProfile", () => {
  const tenantId = "tenant-123";
  const validInput = {
    rubro: "barberia" as const,
    name: "Barbería El Corte",
    slug: "barberia-el-corte",
    images: [] as string[],
    hours: {} as Record<string, { open: string; close: string }>,
    team: [] as Array<{ name: string; role: string; bio?: string; photoUrl?: string }>,
    services: [] as Array<{ name: string; description?: string; priceCLP?: number; durationMin?: number }>,
    faqs: [] as Array<{ question: string; answer: string }>,
    social: {} as { instagram?: string; facebook?: string; tiktok?: string; web?: string },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls withTenant with correct tenantId", async () => {
    mockTx.businessProfile.create.mockResolvedValue({ id: "bp-1", ...validInput, tenantId });
    mockTx.siteTemplate.findUnique.mockResolvedValue({ id: "template-1", rubro: "barberia" });
    mockTx.site.create.mockResolvedValue({ id: "site-1", subdomain: "barberia-el-corte" });

    await createBusinessProfile(validInput, tenantId);

    expect(withTenant).toHaveBeenCalledWith(tenantId, expect.any(Function));
  });

  it("creates BusinessProfile with validated data", async () => {
    const createdProfile = { id: "bp-1", ...validInput, tenantId, images: [], team: [], services: [], faqs: [], hours: {}, social: {} };
    mockTx.businessProfile.create.mockResolvedValue(createdProfile);
    mockTx.siteTemplate.findUnique.mockResolvedValue({ id: "template-1", rubro: "barberia" });
    mockTx.site.create.mockResolvedValue({ id: "site-1", subdomain: "barberia-el-corte" });

    const result = await createBusinessProfile(validInput, tenantId);

    expect(mockTx.businessProfile.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        rubro: "barberia",
        name: "Barbería El Corte",
        slug: "barberia-el-corte",
        tenantId,
      }),
    });
    expect(result.businessProfile).toEqual(createdProfile);
  });

  it("creates Site in draft status linked to BusinessProfile", async () => {
    const createdProfile = { id: "bp-1", ...validInput, tenantId, images: [], team: [], services: [], faqs: [], hours: {}, social: {} };
    const createdSite = { id: "site-1", subdomain: "barberia-el-corte", status: "draft" };
    mockTx.businessProfile.create.mockResolvedValue(createdProfile);
    mockTx.siteTemplate.findUnique.mockResolvedValue({ id: "template-1", rubro: "barberia" });
    mockTx.site.create.mockResolvedValue(createdSite);

    const result = await createBusinessProfile(validInput, tenantId);

    expect(mockTx.site.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId,
        businessProfileId: "bp-1",
        templateId: "template-1",
        name: "Barbería El Corte",
        subdomain: "barberia-el-corte",
        status: "draft",
      }),
    });
    expect(result.site).toEqual(createdSite);
  });

  it("throws when tenantId is empty", async () => {
    await expect(createBusinessProfile(validInput, "")).rejects.toThrow("withTenant() requiere un tenantId valido");
  });

  it("throws when rubro has no template", async () => {
    mockTx.siteTemplate.findUnique.mockResolvedValue(null);
    await expect(createBusinessProfile(validInput, tenantId)).rejects.toThrow("No template found for rubro: barberia");
  });
});

describe("getBusinessProfile", () => {
  const tenantId = "tenant-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns business profile for tenant", async () => {
    const profile = { id: "bp-1", rubro: "barberia", name: "Barbería", slug: "barberia", tenantId };
    mockTx.businessProfile.findUnique.mockResolvedValue(profile);

    const result = await getBusinessProfile(tenantId);

    expect(withTenant).toHaveBeenCalledWith(tenantId, expect.any(Function));
    expect(mockTx.businessProfile.findUnique).toHaveBeenCalledWith({
      where: { tenantId },
    });
    expect(result).toEqual(profile);
  });

  it("returns null when not found", async () => {
    mockTx.businessProfile.findUnique.mockResolvedValue(null);

    const result = await getBusinessProfile(tenantId);

    expect(result).toBeNull();
  });
});

describe("updateBusinessProfile", () => {
  const tenantId = "tenant-123";
  const profileId = "bp-1";
  const updateData = {
    name: "Nueva Barbería",
    phone: "+56987654321",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates business profile with validated data", async () => {
    const updatedProfile = { id: profileId, ...updateData, rubro: "barberia", slug: "barberia-el-corte", tenantId };
    mockTx.businessProfile.update.mockResolvedValue(updatedProfile);

    const result = await updateBusinessProfile(profileId, updateData, tenantId);

    expect(withTenant).toHaveBeenCalledWith(tenantId, expect.any(Function));
    expect(mockTx.businessProfile.update).toHaveBeenCalledWith({
      where: { id: profileId },
      data: expect.objectContaining(updateData),
    });
    expect(result).toEqual(updatedProfile);
  });

  it("throws when tenantId is empty", async () => {
    await expect(updateBusinessProfile(profileId, updateData, "")).rejects.toThrow("withTenant() requiere un tenantId valido");
  });

  it("validates partial update data", async () => {
    const invalidUpdate = { ...updateData, phone: "invalid-phone" };
    mockTx.businessProfile.update.mockRejectedValue(new Error("Validation failed"));

    await expect(updateBusinessProfile(profileId, invalidUpdate, tenantId)).rejects.toThrow();
  });
});