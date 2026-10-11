import { describe, it, expect } from "vitest";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "@/tailwind.config";
import { colors, fonts, layout } from "@/lib/design/tokens";

describe("design tokens — palette (spec §5)", () => {
  it("exposes the exact spec hex values", () => {
    expect(colors).toEqual({
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
    });
  });

  it("declares Geist as the primary sans font", () => {
    expect(fonts.sans[0]).toBe("Geist");
  });

  it("exposes layout helpers for container and section rhythm", () => {
    expect(layout.container).toBe("max-w-6xl mx-auto px-4");
    expect(layout.sectionY).toBe("py-20 md:py-28");
  });
});

describe("tailwind config wiring", () => {
  // resolveConfig's declared return type only knows about Tailwind's default
  // colors, so we narrow through `unknown` to read our custom tokens.
  const resolved = resolveConfig(tailwindConfig) as unknown as {
    theme: { colors: Record<string, Record<string, string>> };
    content: { files: string[] };
  };

  it("resolves brand/navy/teal/amber utility colors", () => {
    expect(resolved.theme.colors.brand.DEFAULT).toBe("#2563EB");
    expect(resolved.theme.colors.brand.dark).toBe("#1D4ED8");
    expect(resolved.theme.colors.navy.DEFAULT).toBe("#0F172A");
    expect(resolved.theme.colors.navy["800"]).toBe("#1E293B");
    expect(resolved.theme.colors.teal.DEFAULT).toBe("#0D9488");
    expect(resolved.theme.colors.teal.light).toBe("#5EEAD4");
    expect(resolved.theme.colors.amber.DEFAULT).toBe("#F59E0B");
  });

  it("scans the components directory for classes", () => {
    expect(resolved.content.files.some((file) => file.includes("components/"))).toBe(true);
  });
});
