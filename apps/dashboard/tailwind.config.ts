import type { Config } from "tailwindcss";
import { colors, fonts } from "./lib/design/tokens";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: colors.navy,
          800: colors.navy800,
          900: "#0B1026",
        },
        brand: {
          DEFAULT: colors.brand,
          dark: colors.brandDark,
        },
        teal: {
          DEFAULT: colors.teal,
          dark: colors.tealDark,
          light: colors.tealLight,
        },
        amber: {
          DEFAULT: colors.amber,
        },
        night: colors.night,
        nightDeep: colors.nightDeep,
        night2: colors.night2,
        paper: colors.paper,
        ink: colors.ink,
        inkMuted: colors.inkMuted,
        hairline: colors.hairline,
        signal: colors.signal,
        signalDark: colors.signalDark,
        action: colors.action,
        actionDark: colors.actionDark,
        gold: colors.gold,
        goldDark: colors.goldDark,
        onDark: colors.onDark,
        onDarkMuted: colors.onDarkMuted,
      },
      fontFamily: {
        sans: ["var(--font-figtree)", "Figtree", ...fonts.sans],
        display: ["var(--font-instrument-serif)", "Instrument Serif", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
