# Review Package for Task 1.1

**Plan:** docs/superpowers/plans/2026-08-25-implement-all-phases.md
**Base:** 053f9d28fe18923b9eba3367b376338ea0468b65
**Head:** 843fecff7c97e415381b2956491d61bf3e71b787

## Stat Summary
```
 .../app/api/tenants/conversations/[id]/messages/route.ts  | 15 ++++-----------
 1 file changed, 4 insertions(+), 11 deletions(-)
```

## Full Diff
```
diff --git a/apps/dashboard/app/api/tenants/conversations/[id]/messages/route.ts b/apps/dashboard/app/api/tenants/conversations/[id]/messages/route.ts
index 29c3a4a..3c6fc7a 100644
--- a/apps/dashboard/app/api/tenants/conversations/[id]/messages/route.ts
+++ b/apps/dashboard/app/api/tenants/conversations/[id]/messages/route.ts
@@ -16,20 +16,13 @@ export async function GET(
   }
 
   const tenantId = (session?.user as any)?.tenantId;
-  if (!tenantId) {
-    return NextResponse.json({ error: "Sin tenant" }, { status: 400 });
-  }
+  if (!tenantId) return NextResponse.json({ error: "Sin tenant" }, { status: 400 });
 
-  const messages = await withTenant(tenantId, async (tx) => {
-    const conv = await tx.conversation.findFirst({
-      where: { id: params.id },
-      select: { id: true },
-    });
-
-    if (!conv) return [];
+  const { id } = params;
 
+  const messages = await withTenant(tenantId, async (tx) => {
     return tx.message.findMany({
-      where: { conversationId: conv.id },
+      where: { conversationId: id },
       orderBy: { createdAt: "asc" },
     });
   });
```