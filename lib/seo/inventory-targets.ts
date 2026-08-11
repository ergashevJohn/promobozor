import { HUB_EDITORIAL, type HubEditorial } from "@/lib/hub-editorial";

/**
 * Priority inventory targets for competitive coverage vs brand-hub SERPs.
 * Editorial team should verify real promocodes before publishing — never invent codes.
 */
export const INVENTORY_QUALITY_FLOOR = 150;
export const INVENTORY_QUALITY_TARGET = 300;
export const TOP_HUB_COUNT = 40;

export type InventoryTarget = {
  slug: string;
  kind: HubEditorial["kind"];
  priority: number;
  notes: string;
};

export function getTopInventoryTargets(limit = TOP_HUB_COUNT): InventoryTarget[] {
  return HUB_EDITORIAL.slice(0, limit).map((hub, index) => ({
    slug: hub.slug,
    kind: hub.kind,
    priority: index + 1,
    notes:
      hub.kind === "store"
        ? "Ensure active store hub + ≥3 verified promocodes when available"
        : "Ensure brand hub page + link from /promokod/{slug} alias",
  }));
}

export function summarizeInventoryGap(activePromocodeCount: number): {
  current: number;
  floor: number;
  target: number;
  deficitToFloor: number;
  deficitToTarget: number;
  meetsFloor: boolean;
} {
  const deficitToFloor = Math.max(0, INVENTORY_QUALITY_FLOOR - activePromocodeCount);
  const deficitToTarget = Math.max(0, INVENTORY_QUALITY_TARGET - activePromocodeCount);
  return {
    current: activePromocodeCount,
    floor: INVENTORY_QUALITY_FLOOR,
    target: INVENTORY_QUALITY_TARGET,
    deficitToFloor,
    deficitToTarget,
    meetsFloor: activePromocodeCount >= INVENTORY_QUALITY_FLOOR,
  };
}
