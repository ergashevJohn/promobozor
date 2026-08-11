import "dotenv/config";

import { and, eq } from "drizzle-orm";
import { listHubEditorialTargets } from "../../lib/hub-editorial";

/**
 * Upsert unique hub descriptions for top store/brand targets.
 * Does NOT invent promocodes — only editorial entity + translation copy.
 */
async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const { db, brands, brandTranslations, stores, storeTranslations } = await import("../../lib/db");
  const hubs = listHubEditorialTargets();
  let updated = 0;
  let created = 0;

  for (const hub of hubs) {
    if (hub.kind === "brand") {
      const [existing] = await db
        .select({
          brandId: brands.id,
        })
        .from(brandTranslations)
        .innerJoin(brands, eq(brandTranslations.brandId, brands.id))
        .where(and(eq(brandTranslations.slug, hub.slug), eq(brandTranslations.language, "uz")))
        .limit(1);

      let brandId = existing?.brandId;
      if (!brandId) {
        const [inserted] = await db
          .insert(brands)
          .values({
            isActive: true,
            imageUrl: null,
            websiteUrl: null,
          })
          .returning({ id: brands.id });
        brandId = inserted.id;
        created += 1;
        console.log(`Created brand ${hub.slug}`);
      }

      for (const language of ["uz", "ru", "en"] as const) {
        const [tr] = await db
          .select({ id: brandTranslations.id, description: brandTranslations.description })
          .from(brandTranslations)
          .where(
            and(eq(brandTranslations.brandId, brandId), eq(brandTranslations.language, language))
          )
          .limit(1);

        const description = hub.description[language];
        const name = hub.name[language];
        if (tr) {
          const thin = !tr.description || tr.description.trim().length < 80;
          if (thin) {
            await db
              .update(brandTranslations)
              .set({
                description,
                name,
                updatedAt: new Date(),
              })
              .where(eq(brandTranslations.id, tr.id));
            updated += 1;
          }
        } else {
          await db.insert(brandTranslations).values({
            brandId,
            language,
            name,
            slug: hub.slug,
            description,
            metaTitle: `${name} promokod`,
            metaDescription: description.slice(0, 155),
          });
          created += 1;
        }
      }
    } else {
      const [existing] = await db
        .select({
          storeId: stores.id,
        })
        .from(storeTranslations)
        .innerJoin(stores, eq(storeTranslations.storeId, stores.id))
        .where(and(eq(storeTranslations.slug, hub.slug), eq(storeTranslations.language, "uz")))
        .limit(1);

      let storeId = existing?.storeId;
      if (!storeId) {
        const [inserted] = await db
          .insert(stores)
          .values({
            isActive: true,
            logoUrl: null,
            websiteUrl: null,
          })
          .returning({ id: stores.id });
        storeId = inserted.id;
        created += 1;
        console.log(`Created store ${hub.slug}`);
      }

      for (const language of ["uz", "ru", "en"] as const) {
        const [tr] = await db
          .select({ id: storeTranslations.id, description: storeTranslations.description })
          .from(storeTranslations)
          .where(
            and(eq(storeTranslations.storeId, storeId), eq(storeTranslations.language, language))
          )
          .limit(1);

        const description = hub.description[language];
        const name = hub.name[language];
        if (tr) {
          const thin = !tr.description || tr.description.trim().length < 80;
          if (thin) {
            await db
              .update(storeTranslations)
              .set({
                description,
                name,
                updatedAt: new Date(),
              })
              .where(eq(storeTranslations.id, tr.id));
            updated += 1;
          }
        } else {
          await db.insert(storeTranslations).values({
            storeId,
            language,
            name,
            slug: hub.slug,
            description,
            metaTitle: `${name} promokod`,
            metaDescription: description.slice(0, 155),
          });
          created += 1;
        }
      }
    }
  }

  console.log(`Done. created=${created} updated=${updated}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
