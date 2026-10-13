import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DemoChat } from "@/components/marketing/demo-chat";
import { DEMO_BUSINESSES } from "@/lib/demos/knowledge";
import type { DemoHistoryEntry } from "@/lib/demos/schema";
import { copy } from "@/lib/marketing/copy";

interface DemoRequestBody {
  message: string;
  sessionId?: string;
  history?: DemoHistoryEntry[];
}

/** Stubs `fetch` so every reply is unique and inspectable per message. */
function mockFetch() {
  const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as DemoRequestBody;

    return {
      ok: true,
      status: 200,
      json: async () => ({ reply: `Respuesta a: ${body.message}` }),
    } as unknown as Response;
  });

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

/** Parses the body of the last (or nth) request the component sent. */
function requestBody(fetchMock: ReturnType<typeof vi.fn>, index?: number): DemoRequestBody {
  const calls = fetchMock.mock.calls as Array<[string, RequestInit]>;
  const call = index === undefined ? calls[calls.length - 1] : calls[index];

  return JSON.parse(String(call[1].body)) as DemoRequestBody;
}

async function send(user: ReturnType<typeof userEvent.setup>, text: string) {
  const input = screen.getByLabelText(copy.demoChat.inputLabel);
  await user.clear(input);
  await user.type(input, text);
  await user.click(screen.getByRole("button", { name: copy.demoChat.sendLabel }));
  await screen.findByText(`Respuesta a: ${text}`);
}

const GREETING = DEMO_BUSINESSES.peluqueria.greeting;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DemoChat", () => {
  it("sends the conversation so far as history", async () => {
    const fetchMock = mockFetch();
    const user = userEvent.setup();

    render(<DemoChat />);
    await send(user, "m1");

    expect(requestBody(fetchMock).history).toEqual([
      { role: "assistant", content: GREETING },
    ]);
  });

  it("carries the prior turns into the next request", async () => {
    const fetchMock = mockFetch();
    const user = userEvent.setup();

    render(<DemoChat />);
    await send(user, "m1");
    await send(user, "m2");

    expect(requestBody(fetchMock).history).toEqual([
      { role: "assistant", content: GREETING },
      { role: "user", content: "m1" },
      { role: "assistant", content: "Respuesta a: m1" },
    ]);
  });

  it("caps the history it sends at the last eight turns", async () => {
    const fetchMock = mockFetch();
    const user = userEvent.setup();

    render(<DemoChat />);

    for (let turn = 1; turn <= 5; turn += 1) {
      await send(user, `m${turn}`);
    }

    const history = requestBody(fetchMock).history ?? [];

    expect(history).toHaveLength(8);
    // The oldest turn (the greeting) has been dropped.
    expect(history[0]).toEqual({ role: "user", content: "m1" });
  });

  it("points the WhatsApp CTA at the selected rubro", () => {
    mockFetch();

    render(<DemoChat />);

    const cta = screen.getByRole("link", { name: copy.demoChat.ctaLabel });

    expect(cta.getAttribute("href")).toContain("https://wa.me/");
    expect(cta.getAttribute("href")).toContain(
      encodeURIComponent(DEMO_BUSINESSES.peluqueria.label),
    );
  });

  it("shows the reply and clears the input", async () => {
    const fetchMock = mockFetch();
    const user = userEvent.setup();

    render(<DemoChat />);
    await send(user, "m1");

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(screen.getByText(`Respuesta a: m1`)).toBeInTheDocument();
    expect(screen.getByLabelText(copy.demoChat.inputLabel)).toHaveValue("");
  });
});
