import { describe, expect, it } from "vitest";
import { CHAP, HEAD, SECTION, TONE, WRAP } from "@/lib/marketing/shell";

describe("marketing shell", () => {
  it("exposes the section rhythm and container", () => {
    expect(WRAP).toContain("max-w-[1160px]");
    expect(SECTION).toContain("clamp(");
    expect(HEAD).toBe("max-w-[46rem]");
  });

  it("maps every tone to a background and text colour", () => {
    expect(TONE.paper).toBe("bg-paper text-ink");
    expect(TONE.white).toBe("bg-white text-ink");
    expect(TONE.night).toBe("bg-night text-onDark");
    expect(TONE.nightDeep).toBe("bg-nightDeep text-onDark");
  });

  it("has a chapter eyebrow style", () => {
    expect(CHAP).toContain("text-signalDark");
    expect(CHAP).toContain("tracking-wide");
  });
});
