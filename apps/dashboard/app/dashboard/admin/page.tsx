import { TenantsHome } from "../tenants-home";

export const dynamic = "force-dynamic";

/**
 * Root of the internal area. It is the same main menu as `/dashboard` for
 * staff, and it exists because a branch with no page would leave the gate in
 * `admin/layout.tsx` unreachable (Next does not render the layout of a segment
 * that has no page, so `/dashboard/admin/<anything>` without a page is a plain
 * 404, not a redirect).
 */
export default function AdminHome() {
  return <TenantsHome />;
}
