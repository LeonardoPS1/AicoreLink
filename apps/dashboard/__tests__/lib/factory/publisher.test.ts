import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockTx } = vi.hoisted(() => ({
  mockTx: {
    site: { findUnique: vi.fn(), update: vi.fn() },
    siteVersion: { findUnique: vi.fn() },
    publishLog: { create: vi.fn() },
  },
}));

vi.mock("@/lib/tenant-context", () => ({
  withTenant: vi.fn(async (tenantId: string, fn: (tx: any) => unknown) => {
    if (!tenantId) throw new Error("tenantId is required");
    return fn(mockTx);
  }),
}));

vi.mock("@/lib/db", () => ({ db: {} }));

vi.mock("@/lib/factory/html-renderer", () => ({
  renderBlocksToHtml: vi.fn(() => "<div>blocks</div>"),
  escapeHtml: vi.fn((value: unknown) => String(value ?? "")),
}));

vi.mock("fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs/promises")>();
  return {
    ...actual,
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockResolvedValue(undefined),
    access: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("child_process")>();
  return { ...actual, execSync: vi.fn() };
});

import * as fs from "fs/promises";
import {
  publishSite,
  unpublishSite,
  verifyDns,
  requestTls,
  healthCheck,
  generateTraefikConfig,
  PublishError,
} from "@/lib/factory/publisher";

const TENANT_ID = "11111111-1111-1111-1111-111111111111";
const SITE_ID = "22222222-2222-2222-2222-222222222222";

function makeSite(overrides: Record<string, unknown> = {}) {
  return {
    id: SITE_ID,
    tenantId: TENANT_ID,
    subdomain: "peluqueria-maria",
    customDomain: null,
    status: "approved",
    templateId: "tpl-1",
    currentVersionId: null,
    ...overrides,
  };
}

function makeVersion() {
  return {
    id: "ver-1",
    pages: [
      {
        path: "/",
        title: "Inicio",
        content: { blocks: [{ type: "hero", content: { headline: "Hola" } }] },
        meta: {},
        order: 0,
      },
      {
        path: "/contacto",
        title: "Contacto",
        content: { blocks: [{ type: "contact", content: { phone: "+56911112222" } }] },
        meta: {},
        order: 1,
      },
    ],
  };
}

function mockHealthyFetch() {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    text: async () => "OK",
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  vi.clearAllMocks();
  (fs.access as any).mockResolvedValue(undefined);
  mockTx.site.findUnique.mockResolvedValue(makeSite());
  mockTx.siteVersion.findUnique.mockResolvedValue(makeVersion());
  mockTx.site.update.mockResolvedValue({});
  mockTx.publishLog.create.mockResolvedValue({});
  mockHealthyFetch();
});

describe("generateTraefikConfig", () => {
  it("builds a subdomain router with the ACME resolver", () => {
    const config = generateTraefikConfig({
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      domain: "peluqueria-maria.aicorelink.aicorebots.com",
      isCustomDomain: false,
    });
    expect(config).toContain("Host(`peluqueria-maria.aicorelink.aicorebots.com`)");
    expect(config).toContain("certResolver: letsencrypt");
    expect(config).toContain(`http://localhost:3001/sites/${TENANT_ID}/${SITE_ID}`);
  });

  it("builds a custom domain router with SANs", () => {
    const config = generateTraefikConfig({
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      domain: "www.mi-peluqueria.cl",
      isCustomDomain: true,
      sanDomains: ["www.mi-peluqueria.cl", "mi-peluqueria.cl"],
    });
    expect(config).toContain('main: "www.mi-peluqueria.cl"');
    expect(config).toContain('"mi-peluqueria.cl"');
    expect(config).toContain("certResolver: letsencrypt");
  });
});

describe("verifyDns", () => {
  it("returns valid when the CNAME points at our edge", async () => {
    const result = await verifyDns("www.mi-peluqueria.cl", async () => [
      "sites.aicorelink.aicorebots.com.",
    ]);
    expect(result.valid).toBe(true);
    expect(result.cnameTarget).toBe("sites.aicorelink.aicorebots.com.");
  });

  it("returns invalid when the CNAME points elsewhere", async () => {
    const result = await verifyDns("www.mi-peluqueria.cl", async () => ["somewhere-else.com."]);
    expect(result.valid).toBe(false);
  });

  it("returns invalid when the lookup fails", async () => {
    const result = await verifyDns("nope.example", async () => {
      throw new Error("ENOTFOUND");
    });
    expect(result.valid).toBe(false);
  });
});

describe("requestTls", () => {
  it("succeeds once the certificate file exists", async () => {
    const result = await requestTls("d.com", 0);
    expect(result.success).toBe(true);
    expect(result.certPath).toContain("d.com.crt");
  });

  it("fails when the certificate never appears", async () => {
    (fs.access as any).mockRejectedValue(new Error("ENOENT"));
    const result = await requestTls("d.com", 0);
    expect(result.success).toBe(false);
  });
});

describe("healthCheck", () => {
  it("returns true when /health responds OK", async () => {
    expect(await healthCheck("d.com", 1, 0)).toBe(true);
  });

  it("returns false when /health never responds OK", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "boom",
    }) as unknown as typeof fetch;
    expect(await healthCheck("d.com", 1, 0)).toBe(false);
  });
});

describe("publishSite", () => {
  const options = { tlsTimeoutMs: 0, healthRetries: 1, healthIntervalMs: 0 };

  it("publishes to the managed subdomain", async () => {
    const result = await publishSite(
      { siteId: SITE_ID, version: 1, target: "subdomain", tenantId: TENANT_ID },
      options
    );

    expect(result.success).toBe(true);
    expect(result.domain).toBe("peluqueria-maria.aicorelink.aicorebots.com");
    expect(fs.writeFile).toHaveBeenCalled();
    expect(mockTx.site.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "published" }),
      })
    );
    expect(mockTx.publishLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "publish", status: "success" }),
      })
    );
  });

  it("publishes to a verified custom domain", async () => {
    const result = await publishSite(
      {
        siteId: SITE_ID,
        version: 1,
        target: "custom",
        customDomain: "www.mi-peluqueria.cl",
        tenantId: TENANT_ID,
      },
      { ...options, resolveCname: async () => ["sites.aicorelink.aicorebots.com."] }
    );
    expect(result.success).toBe(true);
    expect(result.domain).toBe("www.mi-peluqueria.cl");
  });

  it("requires a customDomain for the custom target", async () => {
    await expect(
      publishSite({ siteId: SITE_ID, version: 1, target: "custom", tenantId: TENANT_ID })
    ).rejects.toThrow("customDomain is required");
  });

  it("rejects when the site is not found", async () => {
    mockTx.site.findUnique.mockResolvedValue(null);
    await expect(
      publishSite({ siteId: SITE_ID, version: 1, target: "subdomain", tenantId: TENANT_ID })
    ).rejects.toThrow("Site not found");
  });

  it("rejects when the site belongs to another tenant", async () => {
    mockTx.site.findUnique.mockResolvedValue(makeSite({ tenantId: "other-tenant" }));
    await expect(
      publishSite({ siteId: SITE_ID, version: 1, target: "subdomain", tenantId: TENANT_ID })
    ).rejects.toThrow("Site not owned by tenant");
  });

  it("rejects a concurrent publish with 409", async () => {
    mockTx.site.findUnique.mockResolvedValue(makeSite({ status: "publishing" }));
    const error = await publishSite({
      siteId: SITE_ID,
      version: 1,
      target: "subdomain",
      tenantId: TENANT_ID,
    }).catch((e) => e as PublishError);

    expect(error).toBeInstanceOf(PublishError);
    expect((error as PublishError).statusCode).toBe(409);
    expect((error as PublishError).code).toBe("CONCURRENT_PUBLISH");
  });

  it("rejects when the site is not approved", async () => {
    mockTx.site.findUnique.mockResolvedValue(makeSite({ status: "draft" }));
    await expect(
      publishSite({ siteId: SITE_ID, version: 1, target: "subdomain", tenantId: TENANT_ID })
    ).rejects.toThrow("Site status must be 'approved'");
  });

  it("rejects when the version does not exist", async () => {
    mockTx.siteVersion.findUnique.mockResolvedValue(null);
    await expect(
      publishSite({ siteId: SITE_ID, version: 9, target: "subdomain", tenantId: TENANT_ID })
    ).rejects.toThrow("Version 9 not found");
  });

  it("rejects an unverified custom domain and reverts status", async () => {
    await expect(
      publishSite(
        {
          siteId: SITE_ID,
          version: 1,
          target: "custom",
          customDomain: "www.mi-peluqueria.cl",
          tenantId: TENANT_ID,
        },
        { ...options, resolveCname: async () => ["elsewhere.example."] }
      )
    ).rejects.toThrow("CNAME verification failed");

    expect(mockTx.site.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "approved" } })
    );
    expect(mockTx.publishLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "failed" }),
      })
    );
  });

  it("rejects when TLS provisioning fails", async () => {
    (fs.access as any).mockRejectedValue(new Error("ENOENT"));
    await expect(
      publishSite(
        { siteId: SITE_ID, version: 1, target: "subdomain", tenantId: TENANT_ID },
        options
      )
    ).rejects.toThrow("TLS certificate could not be obtained");
  });

  it("rejects when the health check fails", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "nope",
    }) as unknown as typeof fetch;

    await expect(
      publishSite(
        { siteId: SITE_ID, version: 1, target: "subdomain", tenantId: TENANT_ID },
        options
      )
    ).rejects.toThrow("Health check failed");
  });
});

describe("unpublishSite", () => {
  it("removes routing and marks the site unpublished", async () => {
    const result = await unpublishSite(SITE_ID, TENANT_ID);
    expect(result.success).toBe(true);
    expect(mockTx.site.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "unpublished" } })
    );
    expect(mockTx.publishLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "unpublish", status: "success" }),
      })
    );
  });

  it("rejects when the site is not found", async () => {
    mockTx.site.findUnique.mockResolvedValue(null);
    await expect(unpublishSite(SITE_ID, TENANT_ID)).rejects.toThrow("Site not found");
  });

  it("rejects when the site belongs to another tenant", async () => {
    mockTx.site.findUnique.mockResolvedValue(makeSite({ tenantId: "other-tenant" }));
    await expect(unpublishSite(SITE_ID, TENANT_ID)).rejects.toThrow("Site not owned by tenant");
  });
});
