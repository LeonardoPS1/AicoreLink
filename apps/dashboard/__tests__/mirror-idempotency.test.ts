import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  convFindFirst: vi.fn(),
  convCreate: vi.fn(),
  convUpsert: vi.fn(),
  msgFindFirst: vi.fn(),
  msgFindUnique: vi.fn(),
  msgCreate: vi.fn(),
  msgUpsert: vi.fn(),
}));

vi.mock("@prisma/client", () => ({
  PrismaClient: class {
    constructor() {
      throw new Error("must not open client");
    }
  },
}));

import { mirrorMessage, __resetMirroredMessageIds } from "@/lib/conversations/mirror";

describe("mirrorMessage", () => {
  beforeEach(() => {
    __resetMirroredMessageIds();
    state.convFindFirst.mockReset();
    state.convCreate.mockReset();
    state.convUpsert.mockReset();
    state.msgFindFirst.mockReset();
    state.msgFindUnique.mockReset();
    state.msgCreate.mockReset();
    state.msgUpsert.mockReset();
  });

  it("returns created=true on first mirror", async () => {
    state.convFindFirst.mockResolvedValue({ id: "conv-1" });
    state.msgFindFirst.mockResolvedValue(null);
    state.msgCreate.mockResolvedValue({ id: "msg-1" });

    const tx = {
      conversation: { findFirst: state.convFindFirst, create: state.convCreate, upsert: state.convUpsert },
      message: { findFirst: state.msgFindFirst, findUnique: state.msgFindUnique, create: state.msgCreate, upsert: state.msgUpsert },
    };

    const r = await mirrorMessage(tx, {
      tenantId: "tenant-1",
      conversationKey: "cw_tenant-1_42",
      chatwootMessageId: 42,
      direction: "in",
      content: "hola",
      senderRef: "contact-1",
    });

    expect(r).toEqual({ created: true });
    expect(state.msgCreate).toHaveBeenCalledTimes(1);
  });

  it("returns created=false on replay without duplicating", async () => {
    state.convFindFirst.mockResolvedValue({ id: "conv-1" });
    state.msgFindFirst.mockResolvedValue({ id: "msg-1" });

    const tx = {
      conversation: { findFirst: state.convFindFirst, create: state.convCreate, upsert: state.convUpsert },
      message: { findFirst: state.msgFindFirst, findUnique: state.msgFindUnique, create: state.msgCreate, upsert: state.msgUpsert },
    };

    const r = await mirrorMessage(tx, {
      tenantId: "tenant-1",
      conversationKey: "cw_tenant-1_42",
      chatwootMessageId: 42,
      direction: "in",
      content: "hola",
      senderRef: "contact-1",
    });

    expect(r).toEqual({ created: false });
    expect(state.msgCreate).not.toHaveBeenCalled();
  });

  it("is idempotent across two calls", async () => {
    state.convFindFirst.mockResolvedValue({ id: "conv-1" });
    state.msgFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "msg-1" });
    state.msgCreate.mockResolvedValue({ id: "msg-1" });

    const tx = {
      conversation: { findFirst: state.convFindFirst, create: state.convCreate, upsert: state.convUpsert },
      message: { findFirst: state.msgFindFirst, findUnique: state.msgFindUnique, create: state.msgCreate, upsert: state.msgUpsert },
    };

    const a = await mirrorMessage(tx, {
      tenantId: "tenant-1",
      conversationKey: "cw_tenant-1_42",
      chatwootMessageId: 42,
      direction: "in",
      content: "hola",
      senderRef: "contact-1",
    });
    const b = await mirrorMessage(tx, {
      tenantId: "tenant-1",
      conversationKey: "cw_tenant-1_42",
      chatwootMessageId: 42,
      direction: "in",
      content: "hola",
      senderRef: "contact-1",
    });

    expect(a).toEqual({ created: true });
    expect(b).toEqual({ created: false });
    expect(state.msgCreate).toHaveBeenCalledTimes(1);
  });
});
