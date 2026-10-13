import {
  BarChart3,
  Building2,
  Factory,
  Filter,
  Home,
  Server,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /**
   * Sections that are planned but not built yet. They stay visible so the panel
   * shows where it is going, but they cannot be opened.
   */
  disabled?: boolean;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/", label: "Menú principal", icon: Home },
  { href: "/tenants", label: "Tenants", icon: Building2 },
  { href: "/fabrica", label: "Fábrica", icon: Factory },
  { href: "/metricas", label: "Métricas", icon: BarChart3, disabled: true },
  { href: "/embudo", label: "Embudo", icon: Filter },
  { href: "/infraestructura", label: "Infraestructura", icon: Server, disabled: true },
];
