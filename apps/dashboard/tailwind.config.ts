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
          light: colors.tealLight,
        },
        amber: {
          DEFAULT: colors.amber,
        },
      },
      fontFamily: {
        sans: [...fonts.sans],
      },
    },
  },
  plugins: [],
};

export default config;
