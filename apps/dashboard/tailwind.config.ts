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
      },
      fontFamily: {
        // `--font-geist-sans` is injected by `geist/font/sans` in the root layout;
        // the literal fallbacks keep tests and non-font environments readable.
        sans: ["var(--font-geist-sans)", ...fonts.sans],
      },
    },
  },
  plugins: [],
};

export default config;
