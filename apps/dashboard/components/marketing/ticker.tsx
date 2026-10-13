import { copy } from "@/lib/marketing/copy";

/**
 * Infinite marquee of the rubros the product is built for.
 *
 * The track renders the list twice so the CSS `translateX(-50%)` keyframe loops
 * seamlessly; the duplicate is hidden from assistive tech.
 */
export function Ticker() {
  return (
    <div className="ticker" data-testid="hero-ticker">
      <span className="sr-only">{copy.hero.askLabel}</span>
      <div className="ticker__track" aria-hidden="true">
        {[0, 1].map((pass) => (
          <ul key={pass} className="ticker__set">
            {copy.ticker.items.map((item) => (
              <li key={`${pass}-${item}`}>{item}</li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
