"use client";

import { trackVerticalView } from "@/lib/analytics";
import { Tabs, type TabItem } from "@/components/ui/tabs";

interface Props {
  items: TabItem[];
  ariaLabel: string;
}

/**
 * Thin client bridge between the rubros section (a Server Component) and
 * analytics: every tab switch is a `vertical_view` event carrying the rubro id.
 * Kept separate from the generic Tabs primitive, which stays analytics-free.
 */
export function VerticalTabs({ items, ariaLabel }: Props) {
  return <Tabs items={items} ariaLabel={ariaLabel} tone="dark" onChange={trackVerticalView} />;
}