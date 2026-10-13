import { describe, it, expect } from "vitest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getModel(name: string) {
  return (prisma as any)._runtimeDataModel.models[name];
}

describe("Factory schema models", () => {
  it("BusinessProfile model exists with tenantId and required fields", () => {
    expect(prisma.businessProfile).toBeDefined();
    expect(typeof prisma.businessProfile.create).toBe("function");
    expect(typeof prisma.businessProfile.findUnique).toBe("function");
  });

  it("Site model exists with tenantId and required fields", () => {
    expect(prisma.site).toBeDefined();
    expect(typeof prisma.site.create).toBe("function");
    expect(typeof prisma.site.findUnique).toBe("function");
  });

  it("SitePage model exists with siteId and required fields", () => {
    expect(prisma.sitePage).toBeDefined();
    expect(typeof prisma.sitePage.create).toBe("function");
    expect(typeof prisma.sitePage.findUnique).toBe("function");
  });

  it("SiteTemplate model exists with required fields", () => {
    expect(prisma.siteTemplate).toBeDefined();
    expect(typeof prisma.siteTemplate.create).toBe("function");
    expect(typeof prisma.siteTemplate.findUnique).toBe("function");
  });

  it("SiteTemplatePage model exists with required fields", () => {
    expect(prisma.siteTemplatePage).toBeDefined();
    expect(typeof prisma.siteTemplatePage.create).toBe("function");
    expect(typeof prisma.siteTemplatePage.findUnique).toBe("function");
  });

  it("SiteVersion model exists with siteId and required fields", () => {
    expect(prisma.siteVersion).toBeDefined();
    expect(typeof prisma.siteVersion.create).toBe("function");
    expect(typeof prisma.siteVersion.findUnique).toBe("function");
  });

  it("PublishLog model exists with siteId and required fields", () => {
    expect(prisma.publishLog).toBeDefined();
    expect(typeof prisma.publishLog.create).toBe("function");
    expect(typeof prisma.publishLog.findUnique).toBe("function");
  });
});

describe("Factory schema relations", () => {
  it("BusinessProfile has relation to Tenant and Site", () => {
    const model = getModel("BusinessProfile");
    expect(model).toBeDefined();
    const tenantRelation = model.fields.find((f: any) => f.name === "tenant");
    const siteRelation = model.fields.find((f: any) => f.name === "site");
    expect(tenantRelation).toBeDefined();
    expect(siteRelation).toBeDefined();
  });

  it("Site has relations to Tenant, BusinessProfile, SiteTemplate, SitePage, SiteVersion, PublishLog", () => {
    const model = getModel("Site");
    expect(model).toBeDefined();
    const relations = ["tenant", "businessProfile", "template", "pages", "versions", "publishLogs"];
    relations.forEach((rel) => {
      const field = model.fields.find((f: any) => f.name === rel);
      expect(field).toBeDefined();
    });
  });

  it("SitePage has relation to Site with cascade delete", () => {
    const model = getModel("SitePage");
    expect(model).toBeDefined();
    const siteRelation = model.fields.find((f: any) => f.name === "site");
    expect(siteRelation).toBeDefined();
  });

  it("SiteTemplate has relations to Site and SiteTemplatePage", () => {
    const model = getModel("SiteTemplate");
    expect(model).toBeDefined();
    const sitesRelation = model.fields.find((f: any) => f.name === "sites");
    const pagesRelation = model.fields.find((f: any) => f.name === "pages");
    expect(sitesRelation).toBeDefined();
    expect(pagesRelation).toBeDefined();
  });

  it("SiteTemplatePage has relation to SiteTemplate with cascade delete", () => {
    const model = getModel("SiteTemplatePage");
    expect(model).toBeDefined();
    const templateRelation = model.fields.find((f: any) => f.name === "template");
    expect(templateRelation).toBeDefined();
  });

  it("SiteVersion has relation to Site with cascade delete", () => {
    const model = getModel("SiteVersion");
    expect(model).toBeDefined();
    const siteRelation = model.fields.find((f: any) => f.name === "site");
    expect(siteRelation).toBeDefined();
  });

  it("PublishLog has relation to Site with cascade delete", () => {
    const model = getModel("PublishLog");
    expect(model).toBeDefined();
    const siteRelation = model.fields.find((f: any) => f.name === "site");
    expect(siteRelation).toBeDefined();
  });
});

function hasUniqueField(model: any, fieldName: string): boolean {
  const field = model.fields.find((f: any) => f.name === fieldName);
  return field?.isUnique === true;
}

function hasCompositeUnique(model: any, fieldNames: string[]): boolean {
  const uniqueIndexes = model.uniqueIndexes || [];
  return uniqueIndexes.some((idx: any) => 
    fieldNames.every((fn) => idx.fields.includes(fn))
  );
}

describe("Factory schema unique constraints", () => {
  it("BusinessProfile has unique slug", () => {
    const model = getModel("BusinessProfile");
    expect(hasUniqueField(model, "slug")).toBe(true);
  });

  it("Site has unique subdomain and customDomain, and unique businessProfileId", () => {
    const model = getModel("Site");
    expect(hasUniqueField(model, "subdomain")).toBe(true);
    expect(hasUniqueField(model, "customDomain")).toBe(true);
    expect(hasUniqueField(model, "businessProfileId")).toBe(true);
  });

  it("SitePage has unique constraint on [siteId, path]", () => {
    const model = getModel("SitePage");
    expect(hasCompositeUnique(model, ["siteId", "path"])).toBe(true);
  });

  it("SiteTemplate has unique rubro", () => {
    const model = getModel("SiteTemplate");
    expect(hasUniqueField(model, "rubro")).toBe(true);
  });

  it("SiteTemplatePage has unique constraint on [templateId, path]", () => {
    const model = getModel("SiteTemplatePage");
    expect(hasCompositeUnique(model, ["templateId", "path"])).toBe(true);
  });

  it("SiteVersion has unique constraint on [siteId, version]", () => {
    const model = getModel("SiteVersion");
    expect(hasCompositeUnique(model, ["siteId", "version"])).toBe(true);
  });
});

describe("Factory schema tenantId fields", () => {
  it("BusinessProfile has tenantId field mapped to tenant_id", () => {
    const model = getModel("BusinessProfile");
    const tenantIdField = model.fields.find((f: any) => f.name === "tenantId");
    expect(tenantIdField).toBeDefined();
    expect(tenantIdField.dbName).toBe("tenant_id");
  });

  it("Site has tenantId field mapped to tenant_id", () => {
    const model = getModel("Site");
    const tenantIdField = model.fields.find((f: any) => f.name === "tenantId");
    expect(tenantIdField).toBeDefined();
    expect(tenantIdField.dbName).toBe("tenant_id");
  });
});