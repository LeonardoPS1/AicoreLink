import { cn } from "@/lib/utils";

export interface SectionHeadingProps {
  /** Anchor id, so nav links and `scroll-mt` land on the right section. */
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
  level?: 2 | 3;
  className?: string;
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  subtitle,
  align = "center",
  tone = "light",
  level = 2,
  className,
}: SectionHeadingProps) {
  const Heading = level === 3 ? "h3" : "h2";

  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "mb-3 text-sm font-medium tracking-wide",
            tone === "dark" ? "text-teal-light" : "text-brand",
          )}
        >
          {eyebrow}
        </p>
      ) : null}

      <Heading
        id={id}
        className={cn(
          "text-3xl font-semibold tracking-tight md:text-4xl",
          tone === "dark" ? "text-white" : "text-navy",
        )}
      >
        {title}
      </Heading>

      {subtitle ? (
        <p
          className={cn(
            "mt-4 text-lg leading-relaxed",
            tone === "dark" ? "text-slate-300" : "text-slate-600",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
