import { describe, expect, it } from "vitest";
import { ENV_ALIASES, applyEnvAliases, resolveEnv } from "@/lib/env";

describe("resolveEnv", () => {
  it("returns the canonical value when both names are set", () => {
    const env = { DATABASE_URL: "canonical", AICORELINK_DATABASE_URL: "legacy" };
    expect(resolveEnv("DATABASE_URL", env)).toBe("canonical");
  });

  it("falls back to the prefixed legacy value when the canonical one is absent", () => {
    const env = { AICORELINK_DATABASE_URL: "legacy" };
    expect(resolveEnv("DATABASE_URL", env)).toBe("legacy");
  });

  it("falls back to the prefixed legacy value when the canonical one is an empty string", () => {
    const env = { DATABASE_URL: "", AICORELINK_DATABASE_URL: "legacy" };
    expect(resolveEnv("DATABASE_URL", env)).toBe("legacy");
  });

  it("returns undefined when neither name is set", () => {
    expect(resolveEnv("DATABASE_URL", {})).toBeUndefined();
  });

  it("returns undefined for a name that has no prefixed counterpart", () => {
    expect(resolveEnv("SOME_OTHER_VAR", { AICORELINK_SOME_OTHER_VAR: "x" })).toBeUndefined();
  });
});

describe("applyEnvAliases", () => {
  it("copies every available legacy value onto its canonical name", () => {
    const env = {
      AICORELINK_DATABASE_URL: "legacy-db",
      AICORELINK_NEXTAUTH_SECRET: "legacy-secret",
    };

    const applied = applyEnvAliases(env);

    expect(env).toMatchObject({
      DATABASE_URL: "legacy-db",
      NEXTAUTH_SECRET: "legacy-secret",
    });
    expect(applied).toEqual(expect.arrayContaining(["DATABASE_URL", "NEXTAUTH_SECRET"]));
  });

  it("never overwrites a canonical value that is already set", () => {
    const env = { DATABASE_URL: "canonical", AICORELINK_DATABASE_URL: "legacy" };

    const applied = applyEnvAliases(env);

    expect(env.DATABASE_URL).toBe("canonical");
    expect(applied).not.toContain("DATABASE_URL");
  });

  it("is idempotent", () => {
    const env = { AICORELINK_DATABASE_URL: "legacy-db" };

    const first = applyEnvAliases(env);
    const second = applyEnvAliases(env);

    expect(first).toEqual(["DATABASE_URL"]);
    expect(second).toEqual([]);
  });

  it("applies nothing to an empty environment", () => {
    expect(applyEnvAliases({})).toEqual([]);
  });

  it("ignores an empty-string legacy value", () => {
    const env = { AICORELINK_DATABASE_URL: "" };
    expect(applyEnvAliases(env)).toEqual([]);
  });
});

describe("ENV_ALIASES", () => {
  it("covers every variable a Dokploy deploy can wipe", () => {
    const canonicalNames = ENV_ALIASES.map((alias) => alias.canonical);
    expect(canonicalNames).toEqual(
      expect.arrayContaining(["DATABASE_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL"]),
    );
    // The staff panel escalates the role on the main connection now, so a
    // dropped DATABASE_URL_ADMIN can no longer take it down.
    expect(canonicalNames).not.toContain("DATABASE_URL_ADMIN");
  });

  it("maps each canonical name to its AICORELINK_-prefixed counterpart", () => {
    for (const alias of ENV_ALIASES) {
      expect(alias.legacy).toBe(`AICORELINK_${alias.canonical}`);
    }
  });
});
