import "dotenv/config";
import { db, offerTags, promocodeTags, promocodes } from "@/lib/db";
import { COLLECTION_KEYS, isCollectionKey } from "@/lib/collections";
import { inArray } from "drizzle-orm";

function value(flag: string) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
const tag = value("--tag");
const ids = (value("--ids") ?? "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);
const apply = process.argv.includes("--apply");

async function main() {
  if (!tag || !isCollectionKey(tag) || ids.length === 0) {
    throw new Error(
      `Usage: tsx scripts/catalog/tag-promocodes.ts --tag <${COLLECTION_KEYS.join("|")}> --ids <uuid,uuid> [--apply]`
    );
  }
  const existing = await db
    .select({ id: promocodes.id })
    .from(promocodes)
    .where(inArray(promocodes.id, ids));
  const found = new Set(existing.map((item) => item.id));
  const missing = ids.filter((id) => !found.has(id));
  if (missing.length) throw new Error(`Unknown promocode IDs: ${missing.join(", ")}`);
  console.log(`${apply ? "Applying" : "Dry run"}: assign ${tag} to ${ids.length} promocode(s).`);
  if (!apply) return;
  await db.transaction(async (tx) => {
    await tx.insert(offerTags).values({ key: tag }).onConflictDoNothing();
    await tx
      .insert(promocodeTags)
      .values(ids.map((promocodeId) => ({ promocodeId, tagKey: tag })))
      .onConflictDoNothing();
  });
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const secret = process.env.REVALIDATE_SECRET || process.env.CRON_SECRET;
  if (!baseUrl || !secret) {
    throw new Error(
      "Tags were saved, but NEXT_PUBLIC_BASE_URL and REVALIDATE_SECRET are required to revalidate promocode caches."
    );
  }
  const response = await fetch(
    `${baseUrl.replace(/\/$/, "")}/api/cache/revalidate?tag=promocodes`,
    {
      method: "POST",
      headers: { "x-revalidate-secret": secret },
    }
  );
  if (!response.ok)
    throw new Error(`Tags were saved, but cache revalidation failed (${response.status}).`);
  console.log("Tag assignments and promocode cache revalidation completed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
