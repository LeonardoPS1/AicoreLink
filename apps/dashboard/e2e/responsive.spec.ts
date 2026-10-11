import { expect, test, type Page } from "@playwright/test";

/**
 * Responsive QA for the landing (plan task D5) at 375 / 768 / 1440 px.
 *
 * Acceptance covered here:
 * - no horizontal overflow at any viewport
 * - every section renders
 * - pricing cards are legible and the highlighted plan keeps its badge
 * - rubro tabs switch panels
 * - the header adapts (hamburger + mobile menu on phones, full nav on desktop)
 * - the sticky WhatsApp bubble never covers the conversion CTAs
 * - the page loads without console/page errors
 */

const SECTIONS = [
  "#inicio",
  "#que-es",
  "#problema",
  "#solucion",
  "#como-funciona",
  "#rubros",
  "#planes",
  "#casos",
  "#preguntas",
  "#contacto",
];

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    scrollWidth,
    `horizontal overflow: scrollWidth ${scrollWidth}px > clientWidth ${clientWidth}px`,
  ).toBeLessThanOrEqual(clientWidth);
}

function boxesOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

test("landing never overflows horizontally", async ({ page }) => {
  await page.goto("/");
  await expectNoHorizontalOverflow(page);

  // Walk the whole document so wide elements further down get exercised too.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(200);
  await expectNoHorizontalOverflow(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoHorizontalOverflow(page);
});

test("all ten sections render", async ({ page }) => {
  await page.goto("/");
  for (const selector of SECTIONS) {
    await expect(page.locator(selector)).toBeVisible();
  }
});

test("pricing cards are legible and complete", async ({ page }) => {
  await page.goto("/");
  await page.locator("#planes").scrollIntoViewIfNeeded();

  const plans = page.locator("#planes article[data-plan]");
  await expect(plans).toHaveCount(3);

  for (const price of ["$49", "$99", "$199"]) {
    await expect(page.locator("#planes").getByText(price, { exact: true }).first()).toBeVisible();
  }

  await expect(page.locator("#planes article[data-highlighted='true']")).toContainText(
    "Más elegido",
  );
});

test("rubro tabs switch panels", async ({ page }) => {
  await page.goto("/");

  const tab = page.locator("#rubros").getByRole("tab", { name: "Talleres" });
  await tab.scrollIntoViewIfNeeded();
  await tab.click();

  await expect(tab).toHaveAttribute("aria-selected", "true");
  await expect(
    page.locator("#rubros").getByRole("tabpanel").getByText("Taller mecánico").first(),
  ).toBeVisible();
  await expect(page.locator("#rubros").getByRole("tab", { name: "Barberías" })).toHaveAttribute(
    "aria-selected",
    "false",
  );
});

test("header adapts to mobile and desktop", async ({ page }) => {
  const viewport = page.viewportSize() ?? { width: 1440, height: 900 };
  const mobile = viewport.width < 768;

  await page.goto("/");

  const hamburger = page.locator('button[aria-controls="mobile-menu"]');
  const desktopNav = page.locator('nav[aria-label="Navegación principal"]');
  const desktopCta = page.locator('a[data-label="header"]');

  if (mobile) {
    await expect(hamburger).toBeVisible();
    await expect(desktopNav).toBeHidden();
    await expect(desktopCta).toBeHidden();

    await hamburger.click();
    await expect(page.locator("#mobile-menu")).toBeVisible();
    await expect(page.locator('a[data-label="header-movil"]')).toBeVisible();

    // The CTA inside the menu closes it and anchors to #contacto.
    await page.locator('a[data-label="header-movil"]').click();
    await expect(page.locator("#mobile-menu")).toBeHidden();
    await expect(page).toHaveURL(/#contacto$/);
  } else {
    await expect(hamburger).toBeHidden();
    await expect(desktopNav).toBeVisible();
    await expect(desktopCta).toBeVisible();
  }
});

test("sticky WhatsApp never covers the conversion CTAs", async ({ page }) => {
  await page.goto("/");

  const bubble = page.locator('a[data-label="sticky"]');
  const targets = [
    page.locator('a[data-label="agendar-diagnostico"]'),
    page.getByRole("button", { name: "Solicitar diagnóstico gratis" }),
  ];

  for (const target of targets) {
    await target.scrollIntoViewIfNeeded();
    // Let the scroll listener flip data-visible and the 300ms transition settle.
    await page.waitForTimeout(450);

    const bubbleBox = await bubble.boundingBox();
    const targetBox = await target.boundingBox();
    if (!bubbleBox || !targetBox) continue;

    expect(
      boxesOverlap(bubbleBox, targetBox),
      "sticky WhatsApp bubble overlaps a conversion CTA",
    ).toBe(false);
  }
});

test("landing loads without console or page errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(800);

  expect(errors).toEqual([]);
});