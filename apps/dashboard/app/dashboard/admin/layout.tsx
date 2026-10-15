import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { authOptions } from "@/lib/auth";
import { isStaffRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Server-side gate of the internal panel. It runs before any page under
 * `admin/` renders, so a client that types the URL never sees internal data;
 * the redirect is the answer instead of a 403 so the browser stays in one panel.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string | null } | undefined)?.role;

  if (!isStaffRole(role)) redirect("/dashboard");

  return <>{children}</>;
}
