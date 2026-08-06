import { promocodes, stores } from "@/lib/db";
import { and, eq, gt, isNull, lte, or, type SQL } from "drizzle-orm";

/**
 * Shared filters for publicly actionable / visible promocodes.
 */
export function activePromocodeConditions(now: Date = new Date()): SQL | undefined {
  return and(
    eq(promocodes.status, "active"),
    or(isNull(promocodes.storeId), eq(stores.isActive, true)),
    or(isNull(promocodes.startsAt), lte(promocodes.startsAt, now)),
    or(isNull(promocodes.expiresAt), gt(promocodes.expiresAt, now))
  );
}

/**
 * Status/date filters only (when stores table is already joined or storeId is irrelevant).
 */
export function activePromocodeStatusConditions(now: Date = new Date()): SQL | undefined {
  return and(
    eq(promocodes.status, "active"),
    or(isNull(promocodes.startsAt), lte(promocodes.startsAt, now)),
    or(isNull(promocodes.expiresAt), gt(promocodes.expiresAt, now))
  );
}
