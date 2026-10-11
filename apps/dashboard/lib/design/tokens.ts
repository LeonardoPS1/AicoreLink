/**
 * Shared design tokens for AicoreLink.
 *
 * Single source of truth for the palette, typography and layout rhythm used by
 * the marketing site and (later) the client portal. The Tailwind config imports
 * from here so utilities and programmatic values (meta theme-color, OG images,
 * charts) never drift apart.
 *
 * Values are defined in the design spec §5.
 */

export const colors = {
  navy: "#0F172A",
  navy800: "#1E293B",
  brand: "#2563EB",
  brandDark: "#1D4ED8",
  teal: "#0D9488",
  tealLight: "#5EEAD4",
  slate50: "#F8FAFC",
  slate200: "#E2E8F0",
  slate600: "#475569",
  amber: "#F59E0B",
} as const;

export const fonts = {
  sans: ["Geist", "ui-sans-serif", "system-ui", "sans-serif"],
} as const;

export const layout = {
  container: "max-w-6xl mx-auto px-4",
  sectionY: "py-20 md:py-28",
} as const;

export type ColorToken = keyof typeof colors;
export type ColorValue = (typeof colors)[ColorToken];
