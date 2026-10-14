import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { authOptions } from "@/lib/auth";
import { isStaffRole } from "@/lib/rbac";
import { getTenantName } from "@/lib/tenant";
import { Providers } from "@/app/providers";
import { AppShell } from "@/components/dashboard/app-shell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

interface SessionUser {
  role?: string | null;
  tenantId?: string | null;
  email?: string | null;
}

/**
 * Single entry point of the panel. The session is resolved here, on the server,
 * and the role decides the menu inside the shell; the route does not decide.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;

  if (!user) redirect("/login");

  const staff = isStaffRole(user.role);
  // Staff has no tenant, and a tenant name only makes sense for a tenant-scoped session.
  const tenantName = staff || !user.tenantId ? null : await getTenantName(user.tenantId);

  return (
    <Providers>
      <AppShell role={user.role ?? "cliente"} email={user.email ?? null} tenantName={tenantName}>
        {children}
      </AppShell>
    </Providers>
  );
}
