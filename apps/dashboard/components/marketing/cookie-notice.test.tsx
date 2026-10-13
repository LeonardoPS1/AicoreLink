import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";

import { CookieNotice } from "@/components/marketing/cookie-notice";

const STORAGE_KEY = "aicorelink-cookie-consent";

function clearStorage() {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

describe("CookieNotice", () => {
  beforeEach(() => {
    clearStorage();
    vi.resetModules();
  });

  it("renders the banner on first visit (no consent stored)", () => {
    render(<CookieNotice />);

    expect(screen.getByRole("region", { name: /aviso de cookies/i })).toBeInTheDocument();
    expect(screen.getByText(/utilizamos cookies/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /aceptar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /rechazar/i })).toBeInTheDocument();
  });

  it("has data-track attributes on accept and decline buttons", () => {
    render(<CookieNotice />);

    const acceptBtn = screen.getByRole("button", { name: /aceptar/i });
    const declineBtn = screen.getByRole("button", { name: /rechazar/i });

    expect(acceptBtn).toHaveAttribute("data-track", "cookie_accept");
    expect(declineBtn).toHaveAttribute("data-track", "cookie_decline");
  });

  it("stores consent in localStorage when accept is clicked", async () => {
    const user = userEvent.setup();
    render(<CookieNotice />);

    await user.click(screen.getByRole("button", { name: /aceptar/i }));

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("accepted");
  });

  it("stores decline in localStorage when decline is clicked", async () => {
    const user = userEvent.setup();
    render(<CookieNotice />);

    await user.click(screen.getByRole("button", { name: /rechazar/i }));

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("declined");
  });

  it("does not render when consent was already accepted", () => {
    window.localStorage.setItem(STORAGE_KEY, "accepted");
    render(<CookieNotice />);

    expect(screen.queryByRole("region", { name: /aviso de cookies/i })).not.toBeInTheDocument();
  });

  it("does not render when consent was already declined", () => {
    window.localStorage.setItem(STORAGE_KEY, "declined");
    render(<CookieNotice />);

    expect(screen.queryByRole("region", { name: /aviso de cookies/i })).not.toBeInTheDocument();
  });

  it("uses Reveal for entrance animation", () => {
    render(<CookieNotice />);

    const banner = screen.getByRole("region", { name: /aviso de cookies/i });
    // Reveal wraps the content in a div with data-visible
    const revealWrapper = banner.closest("[data-visible]");
    expect(revealWrapper).toHaveAttribute("data-visible");
  });
});