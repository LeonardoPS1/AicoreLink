import { expect, test, type Page, type Route } from "@playwright/test";

import { signInAs } from "./session";

/**
 * Factory admin dashboard + full publish funnel (E2.7)
 *
 * Covers: `/dashboard/admin/fabrica` listing with filters + bulk approve, and
 * the review funnel at `/dashboard/admin/fabrica/[siteId]` → checklist →
 * approve → publish → unpublish.
 *
 * The admin pages are client components that fetch from the factory APIs, so
 * every network dependency is mocked with `page.route` — no DB required.
 *
 * The internal area is gated on the server, which `page.route` cannot mock, so
 * every test starts from an already signed in staff session.
 *
 * Runs in all 3 viewports defined in playwright.config.ts:
 * mobile-375 (375x669), tablet-768 (768x1024), desktop-1440 (1440x900).
 */

const TENANT_ID = "11111111-1111-1111-1111-111111111111";
const SITE_ID = "22222222-2222-2222-2222-222222222222";
const SITE_ID_2 = "33333333-3333-3333-3333-333333333333";

function siteListItem(overrides: Record<string, unknown> = {}) {
  return {
    id: SITE_ID,
    name: "Barbería El Corte",
    subdomain: "barberia-el-corte",
    customDomain: null,
    status: "review",
    rubro: "barberia",
    businessName: "Barbería El Corte",
    planTier: "starter",
    currentVersionId: "v1",
    updatedAt: "2026-10-13T12:00:00.000Z",
    publishedAt: null,
    tenant: { id: TENANT_ID, name: "Demo Tenant" },
    ...overrides,
  };
}

function siteDetail(overrides: Record<string, unknown> = {}) {
  return {
    id: SITE_ID,
    tenantId: TENANT_ID,
    name: "Barbería El Corte",
    subdomain: "barberia-el-corte",
    customDomain: null,
    status: "review",
    template: { name: "Barbería Starter", planTier: "starter" },
    businessProfile: { rubro: "barberia", name: "Barbería El Corte" },
    pages: [
      {
        id: "p1",
        path: "/",
        title: "Inicio",
        content: {
          blocks: [
            { type: "hero", content: { headline: "Barbería El Corte", subheadline: "Cortes clásicos" } },
            { type: "services", content: { sectionTitle: "Servicios", items: [{ name: "Corte", priceCLP: 12000 }] } },
          ],
        },
        meta: {
          title: "Barbería El Corte",
          description: "Cortes clásicos en Santiago",
          ogImage: "/og.png",
        },
        order: 0,
      },
    ],
    versions: [
      {
        id: "v1",
        version: 1,
        changelog: "Versión inicial",
        createdBy: "system",
        createdAt: "2026-10-13T12:00:00.000Z",
      },
    ],
    ...overrides,
  };
}

async function mockAdminSites(
  page: Page,
  sites: ReturnType<typeof siteListItem>[],
  onRequest?: (search: string) => void,
) {
  await page.route("**/api/admin/sites**", async (route: Route) => {
    onRequest?.(new URL(route.request().url()).search);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ sites }),
    });
  });
}

interface FunnelState {
  approve: number;
  publish: number;
  unpublish: number;
}

/** Mocks every factory API the review panel talks to. */
async function mockFactoryFunnel(
  page: Page,
  opts: { detail: () => Record<string, unknown> },
  state: FunnelState,
) {
  await page.route("**/api/factory/sites/**", async (route: Route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    const json = (status: number, body: unknown) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

    if (req.method() === "GET" && path.endsWith(`/sites/${SITE_ID}`)) {
      return json(200, { site: opts.detail() });
    }
    if (req.method() === "POST" && path.endsWith(`/sites/${SITE_ID}/approve`)) {
      state.approve += 1;
      return json(200, { success: true, status: "approved" });
    }
    if (req.method() === "POST" && path.endsWith(`/sites/${SITE_ID}/publish`)) {
      state.publish += 1;
      return json(202, { success: true, jobId: "job-1", status: "publishing" });
    }
    if (req.method() === "POST" && path.endsWith(`/sites/${SITE_ID}/unpublish`)) {
      state.unpublish += 1;
      return json(200, { success: true, domain: "barberia-el-corte.aicorebots.com" });
    }
    return json(404, { error: "not mocked" });
  });
}

test.beforeEach(async ({ context }) => {
  await signInAs(context, {
    email: "leo@aicorebots.com",
    role: "dev_aicore",
    isStaff: true,
  });
});

test.describe("Admin factory dashboard", () => {
  test("lists sites in the table", async ({ page }) => {
    await mockAdminSites(page, [
      siteListItem(),
      siteListItem({
        id: SITE_ID_2,
        name: "Taller López",
        subdomain: "taller-lopez",
        status: "published",
        rubro: "taller",
        planTier: "growth",
      }),
    ]);

    await page.goto("/dashboard/admin/fabrica");

    await expect(
      page.getByRole("heading", { name: "Fábrica de sitios" }),
    ).toBeVisible();
    await expect(page.getByTestId("fabrica-table")).toBeVisible();
    await expect(page.getByTestId("fabrica-row")).toHaveCount(2);
    await expect(page.getByText("Barbería El Corte", { exact: false })).toBeVisible();
    await expect(page.getByText("Taller López", { exact: false })).toBeVisible();
  });

  test("filters by status and sends the status query param", async ({ page }) => {
    const searches: string[] = [];
    await mockAdminSites(page, [siteListItem()], (search) => searches.push(search));

    await page.goto("/dashboard/admin/fabrica");
    await expect(page.getByTestId("fabrica-row")).toHaveCount(1);

    await page.getByTestId("filter-status").selectOption("review");

    await expect
      .poll(() => searches.some((s) => s.includes("status=review")))
      .toBe(true);
  });

  test("bulk approve posts approve for selected review sites", async ({ page }) => {
    const approved: string[] = [];
    page.on("dialog", (dialog) => dialog.accept());
    await mockAdminSites(page, [siteListItem()]);
    await page.route("**/api/factory/sites/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (route.request().method() === "POST" && path.endsWith("/approve")) {
        approved.push(path);
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, status: "approved" }),
        });
      }
      return route.fulfill({ status: 404, body: "{}" });
    });

    await page.goto("/dashboard/admin/fabrica");
    await expect(page.getByTestId("fabrica-row")).toHaveCount(1);

    // Select the row (review status ⇒ checkbox enabled), then bulk approve.
    await page.getByTestId("fabrica-table").getByRole("checkbox").first().check();
    await page.getByTestId("bulk-approve").click();

    await expect.poll(() => approved.length).toBe(1);
    expect(approved[0]).toContain(`/sites/${SITE_ID}/approve`);
  });
});

test.describe("Site review funnel", () => {
  test("review → approve → publish", async ({ page }) => {
    const state: FunnelState = { approve: 0, publish: 0, unpublish: 0 };
    page.on("dialog", (dialog) => dialog.accept());
    await mockFactoryFunnel(
      page,
      {
        detail: () =>
          siteDetail({ status: state.publish > 0 ? "published" : "review" }),
      },
      state,
    );

    await page.goto(`/dashboard/admin/fabrica/${SITE_ID}?tenant=${TENANT_ID}`);

    await expect(page.getByText("Información del Sitio")).toBeVisible();
    await expect(page.getByText("Checklist de revisión")).toBeVisible();

    const approve = page.getByTestId("panel-approve");
    await expect(approve).toBeEnabled();
    await approve.click();

    await expect.poll(() => state.approve).toBe(1);
    await expect.poll(() => state.publish).toBe(1);
    await expect(approve).toHaveText("Sitio publicado");
    await expect(approve).toBeDisabled();
  });

  test("approve is blocked when the checklist fails", async ({ page }) => {
    const state: FunnelState = { approve: 0, publish: 0, unpublish: 0 };
    page.on("dialog", (dialog) => dialog.accept());
    await mockFactoryFunnel(
      page,
      {
        detail: () =>
          siteDetail({
            pages: [
              {
                id: "p1",
                path: "/",
                title: "Inicio",
                content: {
                  blocks: [
                    { type: "hero", content: { headline: "Barbería El Corte" } },
                    { type: "services", content: { sectionTitle: "Servicios", items: [{ name: "Corte", priceCLP: 0 }] } },
                  ],
                },
                meta: { title: "Barbería" },
                order: 0,
              },
            ],
          }),
      },
      state,
    );

    await page.goto(`/dashboard/admin/fabrica/${SITE_ID}?tenant=${TENANT_ID}`);

    await expect(page.getByTestId("panel-approve")).toBeDisabled();
    await expect(
      page.getByText("Completa todos los ítems del checklist para habilitar Aprobar"),
    ).toBeVisible();
  });

  test("unpublish a published site", async ({ page }) => {
    const state: FunnelState = { approve: 0, publish: 0, unpublish: 0 };
    page.on("dialog", (dialog) => dialog.accept());
    await mockFactoryFunnel(
      page,
      {
        detail: () =>
          siteDetail({ status: state.unpublish > 0 ? "unpublished" : "published" }),
      },
      state,
    );

    await page.goto(`/dashboard/admin/fabrica/${SITE_ID}?tenant=${TENANT_ID}`);

    const unpublish = page.getByTestId("panel-unpublish");
    await expect(unpublish).toBeEnabled();
    await unpublish.click();

    await expect.poll(() => state.unpublish).toBe(1);
  });
});
