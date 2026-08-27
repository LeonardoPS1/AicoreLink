#### Task 1.1: Add Missing Messages API Route
**Files:**
- Create: `apps/dashboard/app/api/tenants/conversations/[id]/messages/route.ts`

**Interfaces:**
- Consumes: `withTenant` from `lib/tenant-context.ts`, `GET /api/tenants/conversations` response format
- Produces: JSON array of Message objects for conversation detail view

**Steps:**
- [ ] **Step 1: Write failing test**
```typescript
// Test: GET /api/tenants/conversations/:id/messages returns messages
const res = await fetch('/api/tenants/conversations/test-id/messages');
expect(res.status).toBe(200);
const data = await res.json();
expect(Array.isArray(data)).toBe(true);
```
- [ ] **Step 2: Run test to verify it fails** - Expect 404 route not found
- [ ] **Step 3: Write minimal implementation**
```typescript
// apps/dashboard/app/api/tenants/conversations/[id]/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { withTenant } from "@/lib/tenant-context";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  try {
    requireRole(session?.user as any, ["cliente", "admin_clinica", "dev_aicore"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const tenantId = (session?.user as any)?.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Sin tenant" }, { status: 400 });

  const { id } = await params;

  const messages = await withTenant(tenantId, async (tx) => {
    return tx.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
    });
  });

  return NextResponse.json(messages);
}
```
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit** `git add ... && git commit -m "feat(api): add messages route for conversation detail"`