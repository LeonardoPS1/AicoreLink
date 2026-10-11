import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom ships neither of these; components that reveal on scroll or respect
// reduced motion depend on them, so stub them for every test file.
if (typeof window.matchMedia !== "function") {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

if (typeof window.IntersectionObserver === "undefined") {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds: ReadonlyArray<number> = [];

    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
  }

  window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
}

afterEach(() => {
  cleanup();
});
