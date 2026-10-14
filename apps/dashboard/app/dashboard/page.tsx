import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isStaffRole } from "@/lib/rbac";
import { TenantsHome } from "./tenants-home";
import { OwnerHome } from "./owner-home";

export const dynamic = "force-dynamic";

/** The main menu: the role of the session decides which one. */
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string | null } | undefined)?.role;

  return isStaffRole(role) ? <TenantsHome /> : <OwnerHome />;
}
