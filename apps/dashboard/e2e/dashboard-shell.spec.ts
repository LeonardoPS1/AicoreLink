import { expect, test } from "@playwright/test";
import { signInAs } from "./session";

/**
 * The role gate of the single `/dashboard` branch.
 *
 * Covers the three shapes that matter: nobody signed in, a business owner, and
 * Aicore staff. The client cases use a session without a tenant link so the
 * layout never reaches the database; the staff cases read no tenant data either.
 *
 * Runs in the 3 viewports defined in playwright.config.ts. Assertions are DOM
 * based (counts, URLs), so they hold at every breakpoint: the navigation is a
 * single `<nav>` that reflows into a top bar on phones.
 */

test("sends an anonymous visitor to the login page", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("a client cannot reach the Aicore panel by typing the URL", async ({ page, context }) => {
  await signInAs(context, { email: "duena@negocio.cl", role: "cliente", tenantId: null });
  await page.goto("/dashboard/admin");
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("a client sees only the client menu", async ({ page, context }) => {
  await signInAs(context, { email: "duena@negocio.cl", role: "cliente", tenantId: null });
  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: "Leads" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Clientes" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Fábrica" })).toHaveCount(0);
});

test("Aicore staff are not redirected away from the internal panel", async ({ page, context }) => {
  await signInAs(context, { email: "leo@aicorebots.com", role: "dev_aicore", isStaff: true });
  await page.goto("/dashboard/admin");
  await expect(page).toHaveURL(/\/dashboard\/admin$/);
});
