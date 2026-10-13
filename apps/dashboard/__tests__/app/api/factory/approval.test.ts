import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockApproveSite, mockRejectSite } = vi.hoisted(() => ({
  mockApproveSite: vi.fn(),
  mockRejectSite: vi.fn(),
}));

vi.mock("@/lib/factory/approval", () => ({
  approveSite: mockApproveSite,
  rejectSite: mockRejectSite,
}));

import { POST as approvePost } from "@/app/api/factory/sites/[id]/approve/route";
import { POST as rejectPost } from "@/app/api/factory/sites/[id]/reject/route";

const TENANT_ID = "11111111-1111-1111-1111-111111111111";
const SITE_ID = "22222222-2222-2222-2222-222222222222";

class MockNextRequest {
  url: string;
  private _headers: Map<string, string>;
  private _body: string;
  constructor(
    url: string,
    init: { headers?: Record<string, string>; body?: string } = {}
  ) {
    this.url = url;
    this._headers = new Map(Object.entries(init.headers || {}));
    this._body = init.body || "";
  }
  get headers() {
    return {
      get: (key: string) => this._headers.get(key) ?? null,
    };
  }
  async json() {
    return JSON.parse(this._body || "{}");
  }
}
(globalThis as any).NextRequest = MockNextRequest;

function makeRequest(
  body: unknown,
  headers: Record<string, string> = { "x-tenant-id": TENANT_ID }
) {
  return new MockNextRequest("http://localhost/api/factory/sites/" + SITE_ID, {
    headers,
    body: JSON.stringify(body),
  }) as any;
}

function params(id = SITE_ID) {
  return { params: Promise.resolve({ id }) };
}

async function readJson(res: Response) {
  return res.json();
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/factory/sites/[id]/approve", () => {
  it("returns 401 without a tenant header", async () => {
    const res = await approvePost(makeRequest({}, {}), params());
    expect(res.status).toBe(401);
  });

  it("approves the site and returns the new status", async () => {
    mockApproveSite.mockResolvedValue({ id: SITE_ID, status: "approved" });
    const res = await approvePost(makeRequest({}), params());
    expect(res.status).toBe(200);
    const body = await readJson(res);
    expect(body.success).toBe(true);
    expect(body.status).toBe("approved");
    expect(mockApproveSite).toHaveBeenCalledWith(SITE_ID, TENANT_ID, "system");
  });

  it("maps 'Site not found' to 404", async () => {
    mockApproveSite.mockRejectedValue(new Error("Site not found"));
    const res = await approvePost(makeRequest({}), params());
    expect(res.status).toBe(404);
  });

  it("maps 'Site not owned by tenant' to 403", async () => {
    mockApproveSite.mockRejectedValue(new Error("Site not owned by tenant"));
    const res = await approvePost(makeRequest({}), params());
    expect(res.status).toBe(403);
  });

  it("maps a non-review status to 400", async () => {
    mockApproveSite.mockRejectedValue(new Error("Site status must be 'review'"));
    const res = await approvePost(makeRequest({}), params());
    expect(res.status).toBe(400);
  });
});

describe("POST /api/factory/sites/[id]/reject", () => {
  it("returns 401 without a tenant header", async () => {
    const res = await rejectPost(makeRequest({ reason: "x" }, {}), params());
    expect(res.status).toBe(401);
  });

  it("returns 400 for an empty reason", async () => {
    const res = await rejectPost(makeRequest({ reason: "" }), params());
    expect(res.status).toBe(400);
  });

  it("rejects the site back to draft", async () => {
    mockRejectSite.mockResolvedValue({ id: SITE_ID, status: "draft", reason: "Faltan precios" });
    const res = await rejectPost(makeRequest({ reason: "Faltan precios" }), params());
    expect(res.status).toBe(200);
    const body = await readJson(res);
    expect(body.status).toBe("draft");
    expect(body.reason).toBe("Faltan precios");
    expect(mockRejectSite).toHaveBeenCalledWith(SITE_ID, TENANT_ID, "Faltan precios", "system");
  });

  it("maps 'Site not found' to 404", async () => {
    mockRejectSite.mockRejectedValue(new Error("Site not found"));
    const res = await rejectPost(makeRequest({ reason: "x" }), params());
    expect(res.status).toBe(404);
  });
});
