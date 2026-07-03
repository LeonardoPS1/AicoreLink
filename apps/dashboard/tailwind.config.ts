import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0F172A",
        brand: {
          DEFAULT: "#2563EB",
          dark: "#1D4ED8",
        },
        teal: "#0D9488",
      },
    },
  },
  plugins: [],
};

export default config;
