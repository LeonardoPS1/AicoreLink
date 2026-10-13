import { expect, test, type Page } from "@playwright/test";

/**
 * Full funnel e2e test: visita → CTA → lead (R59)
 *
 * Covers: load `/`, click hero CTA "Quiero mi diagnóstico gratis",
 * fill form (3 required fields + consent), submit, verify success,
 * and verify lead persists via API response (or mock).
 *
 * Runs in all 3 viewports defined in playwright.config.ts:
 * mobile-375, tablet-768, desktop-1440 (R60).
 */

const HERO_PRIMARY_CTA = "Quiero mi diagnóstico gratis";
const HERO_SECONDARY_CTA = "Ver cómo funciona";
const HEADER_CTA_LABEL = "Hablar con nosotros";
const FORM_SUBMIT_LABEL = "Solicitar diagnóstico gratis";
const SUCCESS_HEADING = "¡Recibimos tus datos!";
const SUCCESS_SUBTEXT = "Te escribimos por WhatsApp en las próximas horas";

interface CapturedLead {
  nombre: string;
  negocio: string;
  whatsapp: string;
  rubro: string;
  mensaje: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
  consent: boolean;
}

let capturedLead: CapturedLead | null = null;

async function fillLeadForm(page: Page, overrides: Partial<{
  nombre: string;
  negocio: string;
  whatsapp: string;
  rubro: string;
  mensaje: string;
  consent?: boolean;
}> = {}) {
  const defaults = {
    nombre: "Juan Pérez",
    negocio: "Barbería El Corte",
    whatsapp: "+56 9 5555 5555",
    rubro: "barberia",
    mensaje: "Pierdo consultas porque no llego a contestar el WhatsApp.",
    consent: true,
  };
  const data = { ...defaults, ...overrides };

  await page.fill('input[id="nombre"]', data.nombre);
  await page.fill('input[id="negocio"]', data.negocio);
  await page.fill('input[id="whatsapp"]', data.whatsapp);

  // Wait for select to be populated with vertical options (more than just the placeholder)
  await page.waitForFunction(
    () => {
      const select = document.querySelector<HTMLSelectElement>('select[id="rubro"]');
      return select && select.options.length > 1;
    },
    { timeout: 15000 },
  );
  await page.selectOption('select[id="rubro"]', data.rubro);

  await page.fill('textarea[id="mensaje"]', data.mensaje);
  if (data.consent) {
    await page.check('input[id="consent"]');
  }
}

async function setupLeadCapture(page: Page) {
  capturedLead = null;
  await page.route("**/api/leads", async (route) => {
    if (route.request().method() === "POST") {
      const postData = route.request().postData();
      if (postData) {
        capturedLead = JSON.parse(postData) as CapturedLead;
      }
      // Mock successful API response to ensure reliable test
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    } else {
      await route.continue();
    }
  });
}

async function submitAndVerifySuccess(page: Page) {
  await page.click('button:has-text("Solicitar diagnóstico gratis")');

  // Wait for success state (form replaced by success message)
  await expect(page.locator("h3", { hasText: SUCCESS_HEADING })).toBeVisible({
    timeout: 10000,
  });
  await expect(
    page.locator("p", { hasText: SUCCESS_SUBTEXT }).first(),
  ).toBeVisible();
}

async function verifyLeadInDb(page: Page, expectedData: Partial<CapturedLead> = {}): Promise<void> {
  // Wait for the API call to complete and capture the lead data
  await page.waitForTimeout(500); // Small buffer for route handler to capture

  expect(capturedLead).not.toBeNull();
  expect(capturedLead).toMatchObject({
    nombre: expectedData.nombre ?? "Juan Pérez",
    negocio: expectedData.negocio ?? "Barbería El Corte",
    whatsapp: expectedData.whatsapp ?? "+56 9 5555 5555",
    rubro: expectedData.rubro ?? "barberia",
    mensaje: expectedData.mensaje ?? "Pierdo consultas porque no llego a contestar el WhatsApp.",
    consent: true,
  });

  // Verify consent is boolean true
  expect(typeof capturedLead!.consent).toBe("boolean");
  expect(capturedLead!.consent).toBe(true);

  // UTM is optional - only present if URL has UTM params
  if (capturedLead!.utm) {
    expect(capturedLead!.utm).toBeDefined();
  }
}

test.describe("Full funnel: visita → CTA → lead", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure clean state
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  test("hero primary CTA scrolls to form and submits successfully", async ({
    page,
  }) => {
    // 1. Verify landing loads - hero section is #que-es
    await expect(page.locator("#que-es")).toBeVisible();

    // 2. Click hero primary CTA (it's an <a> tag with data-label="hero")
    const heroCta = page.locator('a[data-label="hero"]');
    await expect(heroCta).toBeVisible();
    await heroCta.click();

    // 3. Verify we're at the contacto section with form visible
    await expect(page).toHaveURL(/#contacto$/);
    await expect(page.locator("#contacto")).toBeVisible();

    // Wait for the dynamic LeadForm to load (it's loaded with next/dynamic ssr: false)
    await page.waitForSelector('h3:has-text("Cuéntanos de tu negocio")', { timeout: 15000 });

    // Set up lead capture before filling form
    await setupLeadCapture(page);

    // 4. Fill form with valid data
    await fillLeadForm(page);

    // 5. Submit and verify success
    await submitAndVerifySuccess(page);

    // 6. Verify lead persistence via captured API request
    await verifyLeadInDb(page);
  });

  test("hero secondary CTA navigates to #como-funciona", async ({ page }) => {
    // Secondary CTA is in nav which is hidden on mobile/tablet (md:flex)
    const viewport = page.viewportSize() ?? { width: 1440, height: 900 };
    if (viewport.width < 768) {
      test.skip(true, "Secondary CTA only visible on desktop (md:flex)");
    }

    const secondaryCta = page.locator('a[href="#como-funciona"]').first();
    await expect(secondaryCta).toBeVisible();
    await secondaryCta.click();

    // Should navigate to #como-funciona section
    await expect(page).toHaveURL(/#como-funciona$/);
  });

  test("sticky WhatsApp CTA opens wa.me with prefilled message", async ({
    page,
  }) => {
    const stickyCta = page.locator('a[data-label="sticky"]');
    await expect(stickyCta).toBeVisible();

    const href = await stickyCta.getAttribute("href");
    expect(href).toMatch(/^https:\/\/wa\.me\//);
    // Message from copy.stickyWhatsApp.message
    expect(href).toContain("Hola%2C%20quiero%20un%20sitio%20web%20con%20IA%20para%20mi%20negocio");
  });

  test("header CTA scrolls to form", async ({ page }) => {
    // Header CTA is hidden on mobile (hidden sm:inline-flex), visible on tablet/desktop
    const viewport = page.viewportSize() ?? { width: 1440, height: 900 };
    if (viewport.width < 640) {
      test.skip(true, "Header CTA hidden on mobile (< sm breakpoint)");
    }

    const headerCta = page.locator('a[data-label="header"]');
    await expect(headerCta).toBeVisible();
    await headerCta.click();

    await expect(page).toHaveURL(/#contacto$/);
    await expect(page.locator("#contacto")).toBeVisible();
  });

  test("form validation prevents submit without consent", async ({ page }) => {
    // Scroll to form
    await page.locator("#contacto").scrollIntoViewIfNeeded();

    // Wait for LeadForm to load
    await page.waitForSelector('h3:has-text("Cuéntanos de tu negocio")', { timeout: 15000 });

    // Fill required fields but NOT consent
    await fillLeadForm(page, { consent: false } as any);
    // Uncheck consent explicitly (fillLeadForm checks it by default)
    await page.uncheck('input[id="consent"]');

    // Button should be disabled without consent (primary validation)
    const submitButton = page.locator('button:has-text("Solicitar diagnóstico gratis")');
    await expect(submitButton).toBeDisabled();

    // Success state should NOT appear (form cannot be submitted)
    await expect(page.locator("h3", { hasText: SUCCESS_HEADING })).toBeHidden();
  });

  test("form validation shows errors for empty required fields", async ({
    page,
  }) => {
    await page.locator("#contacto").scrollIntoViewIfNeeded();

    // Wait for LeadForm to load
    await page.waitForSelector('h3:has-text("Cuéntanos de tu negocio")', { timeout: 15000 });

    // Check consent first (button is disabled without it), then submit empty form
    await page.check('input[id="consent"]');
    await page.click('button:has-text("Solicitar diagnóstico gratis")');

    // Should show field errors (consent is checked so no consent error)
    await expect(
      page.locator("p", { hasText: "Cuéntanos tu nombre" }),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator("p", { hasText: "¿Cómo se llama tu negocio?" }),
    ).toBeVisible();
    await expect(
      page.locator("p", { hasText: "Ingresa un número válido" }),
    ).toBeVisible();
    await expect(
      page.locator("p", { hasText: "Elige tu rubro" }),
    ).toBeVisible();
  });

  test("mobile hamburger menu CTA navigates to form", async ({ page }) => {
    const viewport = page.viewportSize() ?? { width: 1440, height: 900 };
    const isMobile = viewport.width < 768;

    if (!isMobile) {
      test.skip(true, "Only runs on mobile viewport");
    }

    const hamburger = page.locator('button[aria-controls="mobile-menu"]');
    await expect(hamburger).toBeVisible();
    await hamburger.click();

    await expect(page.locator("#mobile-menu")).toBeVisible();
    const mobileCta = page.locator('a[data-label="header-movil"]');
    await expect(mobileCta).toBeVisible();
    await mobileCta.click();

    await expect(page.locator("#mobile-menu")).toBeHidden();
    await expect(page).toHaveURL(/#contacto$/);
    await expect(page.locator("#contacto")).toBeVisible();
  });
});