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
  tealDark: "#0F766E",
  tealLight: "#5EEAD4",
  slate50: "#F8FAFC",
  slate200: "#E2E8F0",
  slate600: "#475569",
  amber: "#F59E0B",
  night: "#0A2342",
  nightDeep: "#061529",
  night2: "#123560",
  paper: "#F3F6FA",
  ink: "#12233D",
  inkMuted: "#44566F",
  hairline: "#D5DDE8",
  signal: "#22D3EE",
  signalDark: "#08758A",
  action: "#2F6BFF",
  actionDark: "#1D4FD1",
  gold: "#F5A524",
  goldDark: "#C27803",
  onDark: "#E6EEFB",
  onDarkMuted: "#A9BFDC",
} as const;

export const fonts = {
  sans: ["Figtree", "ui-sans-serif", "system-ui", "sans-serif"],
  display: ["Instrument Serif", "Georgia", "serif"],
} as const;

export const layout = {
  container: "max-w-6xl mx-auto px-4",
  sectionY: "py-20 md:py-28",
  wrap: "mx-auto w-full max-w-[1160px] px-5",
} as const;

export type ColorToken = keyof typeof colors;
export type ColorValue = (typeof colors)[ColorToken];
