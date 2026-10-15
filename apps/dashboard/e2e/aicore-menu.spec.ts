import { expect, test } from "@playwright/test";
import { signInAs } from "./session";

/**
 * The Aicore main menu (`/dashboard`, design §6) for a staff session.
 *
 * `/dashboard` is the shared branch: a staff session renders the cross-tenant
 * menu (`tenants-home.tsx`) and a business owner renders their own home. These
 * tests pin the four blocks of the menu, the responsive invariant (the menu
 * never makes the whole page scroll sideways — the glance table scrolls inside
 * its own container) and the role gate: a client session must never see the
 * Aicore blocks.
 *
 * A staff session reads the database, so the server must be started with
 * `DATABASE_URL` pointing at a database that has the Prisma schema applied and
 * the `aicorelink_admin` role created (see `prisma/rls.sql`). The client session
 * reads no tenant data.
 *
 * Runs in the 3 viewports defined in playwright.config.ts.
 */

const PANEL_TESTIDS = ["health-strip", "alert-list", "totals-row", "tenant-glance-table"] as const;

const STAFF = { email: "leo@aicorebots.com", role: "dev_aicore", isStaff: true };
const CLIENT = { email: "duena@negocio.cl", role: "cliente", tenantId: null };

test("Aicore staff see the four blocks of the main menu", async ({ page, context }) => {
  await signInAs(context, STAFF);
  await page.goto("/dashboard");

  for (const testId of PANEL_TESTIDS) {
    await expect(page.getByTestId(testId)).toBeVisible();
  }
});

test("the main menu never overflows the viewport horizontally", async ({ page, context }) => {
  await signInAs(context, STAFF);
  await page.goto("/dashboard");
  await expect(page.getByTestId("tenant-glance-table")).toBeVisible();

  // The glance table is wide; it must scroll inside its own container instead of
  // widening the document (allow a 1px rounding difference).
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("a client session never sees the Aicore menu", async ({ page, context }) => {
  await signInAs(context, CLIENT);
  await page.goto("/dashboard");

  for (const testId of PANEL_TESTIDS) {
    await expect(page.getByTestId(testId)).toHaveCount(0);
  }
});
