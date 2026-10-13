import { cn } from "@/lib/utils";
import { WRAP, SECTION, TONE, HEAD, CHAP } from "@/lib/marketing/shell";
import { copy } from "@/lib/marketing/copy";

export function PainSection() {
  return (
    <section id="problema" className={cn(SECTION, TONE.paper)}>
      <div className={WRAP}>
        <div className={cn(HEAD, "mx-auto text-center lg:mx-0 lg:text-left mb-10")}>
          <p className={CHAP}>{copy.pains.chapter}</p>
          <h2 className="mt-3 text-[clamp(2rem,5vw,3rem)] font-semibold leading-tight">
            {copy.pains.title}
          </h2>
          <p className="mt-3 text-inkMuted max-w-[46rem]">{copy.pains.closing}</p>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-10 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-28 mb-8 lg:mb-0">
            <div className="rounded-[1rem] border border-hairline bg-white shadow-soft p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-ink">{copy.pains.inboxLabel}</div>
                <div className="text-xs text-inkMuted">{copy.pains.inboxTime}</div>
              </div>
              <div className="text-xs text-inkMuted">
                Esta es una bandeja de ejemplo. Toca cada mensaje y mira qué pasó.
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-3">
            {copy.pains.items.map((item, index) => (
              <details key={index} name="dolor" className="group rounded-[1rem] border border-hairline bg-white shadow-soft overflow-hidden">
                <summary className="flex items-center gap-3 p-4 cursor-pointer list-none">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-paper text-ink text-sm font-semibold">
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                    <span className="block text-xs text-inkMuted truncate">{item.message}</span>
                  </div>
                  <span className="text-xs text-inkMuted whitespace-nowrap">{item.time}</span>
                  <svg className="ml-2 h-4 w-4 text-inkMuted transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </summary>
                <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-open:grid-rows-[1fr]">
                  <div className="overflow-hidden">
                    <div className="p-4 pt-0 space-y-4">
                      <p className="text-sm text-inkMuted">{item.description}</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[0.75rem] border border-hairline p-3">
                          <strong className="text-sm text-ink">Qué pasó</strong>
                          <p className="mt-1 text-sm text-inkMuted">{item.whatHappened}</p>
                        </div>
                        <div className="rounded-[0.75rem] border border-signal bg-cyan-50 p-3">
                          <strong className="text-sm text-ink">Con AicoreLink</strong>
                          <p className="mt-1 text-sm text-ink">{item.withAicoreLink}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
