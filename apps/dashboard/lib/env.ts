/**
 * Environment canonicalisation.
 *
 * The app reads its configuration from unprefixed names (`DATABASE_URL`,
 * `NEXTAUTH_SECRET`, `NEXTAUTH_URL`). The Dokploy
 * application stores the same values under the `AICORELINK_` prefix, and a
 * Dokploy deploy rewrites the service spec from what it stores: anything added
 * by hand with `docker service update --env-add` disappears.
 *
 * On 2026-10-15 that is exactly what happened — the unprefixed names vanished,
 * the app booted without a database URL, and every auth route answered 500.
 * Resolving the canonical name from the prefixed one makes the app indifferent
 * to which of the two survived a deploy, so a deployment heals itself.
 *
 * The prefixed name is only ever a fallback: a real canonical value always wins.
 */

export type EnvSource = Record<string, string | undefined>;

/** A canonical variable and the prefixed name Dokploy also stores it under. */
export interface EnvAlias {
  readonly canonical: string;
  readonly legacy: string;
}

export const ENV_ALIASES: readonly EnvAlias[] = [
  { canonical: "DATABASE_URL", legacy: "AICORELINK_DATABASE_URL" },
  { canonical: "NEXTAUTH_SECRET", legacy: "AICORELINK_NEXTAUTH_SECRET" },
  { canonical: "NEXTAUTH_URL", legacy: "AICORELINK_NEXTAUTH_URL" },
];

function aliasOf(name: string): EnvAlias | undefined {
  return ENV_ALIASES.find((alias) => alias.canonical === name);
}

/**
 * Reads a canonical variable, falling back to its prefixed counterpart.
 * An empty string counts as unset: an empty DSN is as unusable as a missing one.
 */
export function resolveEnv(name: string, env: EnvSource = process.env): string | undefined {
  const canonical = env[name];
  if (canonical) return canonical;

  const alias = aliasOf(name);
  if (!alias) return undefined;

  const legacy = env[alias.legacy];
  return legacy ? legacy : undefined;
}

/**
 * Copies every prefixed value onto its canonical name when the canonical one is
 * unset, and returns the canonical names it filled. Idempotent: a second call is
 * always a no-op, so importing this module more than once is harmless.
 */
export function applyEnvAliases(env: EnvSource = process.env): string[] {
  const applied: string[] = [];

  for (const alias of ENV_ALIASES) {
    if (env[alias.canonical]) continue;

    const legacy = env[alias.legacy];
    if (!legacy) continue;

    env[alias.canonical] = legacy;
    applied.push(alias.canonical);
  }

  return applied;
}

/** The main connection URL, or undefined when neither name carries it. */
export function databaseUrl(env: EnvSource = process.env): string | undefined {
  return resolveEnv("DATABASE_URL", env);
}

/** The NextAuth session secret, or undefined when neither name carries it. */
export function nextAuthSecret(env: EnvSource = process.env): string | undefined {
  return resolveEnv("NEXTAUTH_SECRET", env);
}

// Self-heal on load so every reader of process.env — including Prisma's own
// datasource resolution and NextAuth's internal URL handling — sees the
// canonical names, not just the modules that import this one.
applyEnvAliases();
