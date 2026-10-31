import coreWebVitals from "eslint-config-next/core-web-vitals";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  {
    ignores: ["node_modules/**", ".next/**", "e2e/**", "playwright-report/**", "test-results/**", "next-env.d.ts"],
  },
  ...coreWebVitals,
  {
    rules: {
      // eslint-plugin-react-hooks v7 (React Compiler era) flags any setState reached
      // synchronously from an effect body, including the SSR-safe "read an external
      // system on mount" pattern (matchMedia, localStorage, search params). Those
      // effects are correct here; the rule needs a dedicated refactor pass
      // (useSyncExternalStore / lazy initialisers) tracked outside this upgrade.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default config;
