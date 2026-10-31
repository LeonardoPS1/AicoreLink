"use client";

import dynamic from "next/dynamic";

/**
 * Client-side wrapper around the lazily loaded lead form.
 *
 * The lead form (and its zod chunk) is the heaviest client module on the
 * landing. Loading it lazily keeps it off the critical path: the rest of the
 * page hydrates first, then the form mounts. The dynamic import has to live in
 * a Client Component — Next no longer allows `ssr: false` at module scope of a
 * Server Component.
 */
const LeadForm = dynamic(
  () => import("@/components/marketing/lead-form").then((mod) => mod.LeadForm),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden="true"
        className="rounded-2xl border border-white/10 bg-white p-6 sm:p-8"
      >
        <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-slate-200" />
        <div className="mt-6 h-28 animate-pulse rounded-xl bg-slate-100" />
        <div className="mt-4 h-11 animate-pulse rounded-lg bg-slate-200" />
      </div>
    ),
  },
);

export function LazyLeadForm() {
  return <LeadForm />;
}
