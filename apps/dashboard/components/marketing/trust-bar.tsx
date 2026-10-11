import { copy } from "@/lib/marketing/copy";

export function TrustBar() {
  return (
    <section aria-label="Por qué importa responder primero" className="border-y border-white/10 bg-navy-800">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <p className="mx-auto max-w-3xl text-balance text-center text-sm leading-relaxed text-slate-300 sm:text-base">
          {copy.trustBar.statement}
        </p>

        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {copy.trustBar.items.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-medium text-slate-100"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
