export type SectionTone = "paper" | "white" | "night" | "nightDeep";

export const WRAP = "mx-auto w-full max-w-[1160px] px-5";
export const SECTION = "py-[clamp(4rem,9vw,7.5rem)]";
export const HEAD = "max-w-[46rem]";
export const CHAP = "text-sm font-semibold tracking-wide text-signalDark";

export const TONE: Record<SectionTone, string> = {
  paper: "bg-paper text-ink",
  white: "bg-white text-ink",
  night: "bg-night text-onDark",
  nightDeep: "bg-nightDeep text-onDark",
};
