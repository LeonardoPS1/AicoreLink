import { defineConfig } from "@playwright/test";

/**
 * Responsive E2E QA for the marketing landing (plan task D5).
 *
 * Prerequisites:
 * - Landing build running on http://localhost:3111
 *   (npm run build && npm run start -- --port 3111)
 * - Google Chrome installed: tests run with channel: "chrome", so Playwright
 *   does not download its own browsers.
 *
 * Run from apps/dashboard: npm run test:e2e
 */

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3111",
    channel: "chrome",
    headless: true,
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    { name: "mobile-375", use: { viewport: { width: 375, height: 669 } } },
    { name: "tablet-768", use: { viewport: { width: 768, height: 1024 } } },
    { name: "desktop-1440", use: { viewport: { width: 1440, height: 900 } } },
  ],
});