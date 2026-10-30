import { isStaffRole } from "@/lib/rbac";

export interface NavItem {
  href: string;
  label: string;
  soon?: boolean;
}

/**
 * Menu of the business owner. The nine destinations come from the design (§4.2);
 * the ones without a screen yet are marked `soon` so the shell can show them
 * disabled instead of hiding them.
 */
const CLIENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/dashboard/leads", label: "Leads" },
  { href: "/dashboard/conversaciones", label: "Conversaciones" },
  { href: "/dashboard/appointments", label: "Citas" },
  { href: "/dashboard/usage", label: "Uso" },
  { href: "/dashboard/testimonio", label: "Testimonio" },
  { href: "/dashboard/resenas", label: "Reseñas" },
  { href: "/dashboard/sitio", label: "Mi sitio" },
  { href: "/dashboard/reportes", label: "Reportes" },
  { href: "/dashboard/soporte", label: "Soporte" },
  { href: "/dashboard/mi-cuenta", label: "Mi cuenta" },
];

/** Menu of the Aicore staff, in the order of the design (§4.3). */
const STAFF_NAV: NavItem[] = [
  { href: "/dashboard", label: "Menú principal" },
  { href: "/dashboard/admin/tenants", label: "Clientes" },
  { href: "/dashboard/admin/onboarding", label: "Onboarding" },
  { href: "/dashboard/admin/fabrica", label: "Fábrica" },
  { href: "/dashboard/admin/embudo", label: "Embudo" },
  { href: "/dashboard/admin/metricas", label: "Métricas" },
  { href: "/dashboard/admin/asistente", label: "Asistente" },
  { href: "/dashboard/admin/asistente-chat", label: "Chat IA" },
  { href: "/dashboard/admin/aprendizaje", label: "Aprendizaje" },
  { href: "/dashboard/admin/evaluacion", label: "Evaluación IA" },
  { href: "/dashboard/admin/sedes", label: "Sedes" },
  { href: "/dashboard/admin/reactivacion", label: "Reactivación" },
  { href: "/dashboard/admin/pilots", label: "Pilotos" },
  { href: "/dashboard/admin/infraestructura", label: "Infraestructura" },
  { href: "/dashboard/admin/usuarios", label: "Usuarios" },
];

/** The role, not the route, decides the menu. */
export function buildNav(role: string): NavItem[] {
  return isStaffRole(role) ? STAFF_NAV : CLIENT_NAV;
}
