/**
 * Business Profile CRUD for the Fábrica de sitios.
 *
 * Handles validation, creation, retrieval, and update of business profiles
 * with multi-tenant isolation via `withTenant()`.
 */

import { z } from "zod";
import { withTenant } from "@/lib/tenant-context";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/**
 * Rubro enum — the six service verticals AicoreLink targets.
 * Must match the `rubro` values in `SiteTemplate` and `verticals.ts`.
 */
export const RubroEnum = z.enum([
  "barberia",
  "taller",
  "profesional",
  "clinica",
  "inmobiliaria",
  "domicilio",
]);

export type Rubro = z.infer<typeof RubroEnum>;

/**
 * Chilean phone format: +569XXXXXXXX (9 digits after +569).
 */
export const PhoneSchema = z.string().regex(/^\+569\d{8}$/, "Formato: +569XXXXXXXX");

/**
 * Hours schema: record of day -> {open, close}.
 * Empty strings mean closed that day.
 */
const HoursSchema = z.record(
  z.object({
    open: z.string(),
    close: z.string(),
  })
).default({});

/**
 * Team member schema.
 */
const TeamMemberSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  bio: z.string().optional(),
  photoUrl: z.string().url().optional(),
});

/**
 * Service schema.
 */
const ServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  priceCLP: z.number().int().positive().optional(),
  durationMin: z.number().int().positive().optional(),
});

/**
 * FAQ schema.
 */
const FaqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

/**
 * Social links schema.
 */
const SocialSchema = z
  .object({
    instagram: z.string().url().optional(),
    facebook: z.string().url().optional(),
    tiktok: z.string().url().optional(),
    web: z.string().url().optional(),
  })
  .default({});

/**
 * Complete BusinessProfile input schema.
 * All fields optional except rubro, name, slug.
 * Arrays have sensible defaults and max limits.
 */
export const BusinessProfileInput = z.object({
  rubro: RubroEnum,
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/),
  phone: PhoneSchema.optional(),
  email: z.string().email().optional(),
  address: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  logoUrl: z.string().url().optional(),
  images: z.array(z.string().url()).max(10).default([]),
  hours: HoursSchema,
  team: z.array(TeamMemberSchema).max(20).default([]),
  services: z.array(ServiceSchema).max(50).default([]),
  faqs: z.array(FaqSchema).max(20).default([]),
  social: SocialSchema,
});

export type BusinessProfileCreateInput = z.infer<typeof BusinessProfileInput>;
export type BusinessProfileUpdateInput = Partial<BusinessProfileCreateInput>;

/**
 * Maps tenant plan to template tier.
 * Tenant plans: semilla, starter, growth, elite
 * Template tiers: starter, growth, elite
 */
function mapPlanToTemplateTier(plan: string): "starter" | "growth" | "elite" {
  switch (plan) {
    case "semilla":
    case "starter":
      return "starter";
    case "growth":
      return "growth";
    case "elite":
      return "elite";
    default:
      return "starter"; // fallback
  }
}

/**
 * Creates a BusinessProfile and a linked Site (draft) for the tenant.
 *
 * @param input - Validated business profile data
 * @param tenantId - Current tenant ID (from auth)
 * @returns Object with created businessProfile and site
 * @throws If tenantId is invalid, rubro has no template, or slug conflicts
 */
export async function createBusinessProfile(
  input: BusinessProfileCreateInput,
  tenantId: string
): Promise<{ businessProfile: any; site: any }> {
  // Validate input first (throws on invalid)
  const validated = BusinessProfileInput.parse(input);

  return withTenant(tenantId, async (tx) => {
    // Get tenant to determine plan tier for template selection
    const tenant = await tx.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    });

    const templateTier = tenant ? mapPlanToTemplateTier(tenant.plan) : "starter";

    // Check that a template exists for this rubro + plan tier
    const template = await tx.siteTemplate.findUnique({
      where: { rubro_planTier: { rubro: validated.rubro, planTier: templateTier } },
    });

    if (!template) {
      throw new Error(`No template found for rubro: ${validated.rubro} with tier: ${templateTier}`);
    }

    // Create the business profile
    const businessProfile = await tx.businessProfile.create({
      data: {
        tenantId,
        rubro: validated.rubro,
        name: validated.name,
        slug: validated.slug,
        phone: validated.phone,
        email: validated.email,
        address: validated.address,
        description: validated.description,
        logoUrl: validated.logoUrl,
        images: validated.images,
        hours: validated.hours,
        team: validated.team,
        services: validated.services,
        faqs: validated.faqs,
        social: validated.social,
      },
    });

    // Create a draft Site linked to the business profile and template
    const site = await tx.site.create({
      data: {
        tenantId,
        businessProfileId: businessProfile.id,
        templateId: template.id,
        name: validated.name,
        subdomain: validated.slug,
        status: "draft",
      },
    });

    return { businessProfile, site };
  });
}

/**
 * Retrieves the BusinessProfile for the current tenant.
 *
 * @param tenantId - Current tenant ID (from auth)
 * @returns BusinessProfile or null if not found
 */
export async function getBusinessProfile(tenantId: string): Promise<any | null> {
  return withTenant(tenantId, async (tx) => {
    return tx.businessProfile.findUnique({
      where: { tenantId },
    });
  });
}

/**
 * Updates the BusinessProfile for the current tenant.
 *
 * @param id - BusinessProfile ID
 * @param input - Partial business profile data to update
 * @param tenantId - Current tenant ID (from auth)
 * @returns Updated BusinessProfile
 * @throws If tenantId is invalid or profile not found
 */
export async function updateBusinessProfile(
  id: string,
  input: BusinessProfileUpdateInput,
  tenantId: string
): Promise<any> {
  // Validate partial input
  const validated = BusinessProfileInput.partial().parse(input);

  return withTenant(tenantId, async (tx) => {
    return tx.businessProfile.update({
      where: { id },
      data: validated,
    });
  });
}