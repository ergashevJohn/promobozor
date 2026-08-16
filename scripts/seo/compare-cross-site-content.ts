import "dotenv/config";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import {
  combinedSimilarity,
  compareFields,
  normalizeSlugKey,
  worstBucket,
  type SimilarityBucket,
} from "../../lib/seo/content-similarity";
import { plainText } from "../../lib/seo/content-rewrite";

type EntityKind = "store" | "brand" | "category" | "promocode";
type Locale = "uz" | "ru" | "en";

type PeerPage = {
  kind: EntityKind;
  locale: Locale;
  slug: string;
  url: string;
  title: string | null;
  description: string | null;
  body: string | null;
};

type LocalRow = {
  kind: EntityKind;
  locale: Locale;
  slug: string;
  entityId: string;
  translationId: string;
  name: string;
  fields: Record<string, string | null>;
};

type OverlapRow = {
  kind: EntityKind;
  locale: Locale;
  localSlug: string;
  peerSlug: string;
  peerUrl: string;
  entityId: string;
  translationId: string;
  overallBucket: SimilarityBucket;
  maxScore: number;
  fields: ReturnType<typeof compareFields>;
};

type InternalDup = {
  kind: EntityKind;
  locale: Locale;
  leftSlug: string;
  rightSlug: string;
  leftEntityId: string;
  rightEntityId: string;
  reason: "normalized-slug" | "near-name";
};

const PEER_ORIGIN = process.env.PEER_SITE_ORIGIN ?? "https://www.promokoduz.uz";
const LOCALES: Locale[] = ["uz", "ru", "en"];

const PEER_SEGMENT_TO_KIND: Record<string, EntityKind> = {
  brand: "brand",
  brands: "brand",
  brend: "brand",
  store: "store",
  "do-kon": "store",
  magazin: "store",
  category: "category",
  kategoriya: "category",
  promocode: "promocode",
  chegirma: "promocode",
  promokod: "promocode",
  deal: "promocode",
};

function extractTag(html: string, tag: string): string | null {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? plainText(match[1]) : null;
}

function extractMeta(html: string, name: string): string | null {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of metaTags) {
    const current = tag.match(/name=["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if (current === name.toLowerCase()) {
      return tag.match(/content=["']([^"']*)["']/i)?.[1] ?? null;
    }
  }
  return null;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; PromoBozorCrossSiteAudit/1.0)",
      accept: "text/html,application/xml",
    },
    redirect: "follow",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

function parseSitemapLocs(xml: string): string[] {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/gi)).map((match) => match[1].trim());
}

function classifyPeerUrl(url: string): Omit<PeerPage, "title" | "description" | "body"> | null {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 3) return null;
    const [localeRaw, segment, slug] = parts;
    if (!LOCALES.includes(localeRaw as Locale)) return null;
    const kind = PEER_SEGMENT_TO_KIND[segment];
    if (!kind) return null;
    return { kind, locale: localeRaw as Locale, slug, url };
  } catch {
    return null;
  }
}

async function loadPeerIndex(): Promise<PeerPage[]> {
  const pages: PeerPage[] = [];
  for (const locale of LOCALES) {
    const sitemapUrl = `${PEER_ORIGIN}/sitemap/${locale}.xml`;
    let xml: string;
    try {
      xml = await fetchText(sitemapUrl);
    } catch (error) {
      console.warn(`Skipping peer sitemap ${sitemapUrl}:`, error);
      continue;
    }
    const locs = parseSitemapLocs(xml)
      .map(classifyPeerUrl)
      .filter((row): row is NonNullable<typeof row> => Boolean(row));

    // Cap fetch volume for safety; prioritize hubs then sample promos.
    const hubs = locs.filter((row) => row.kind !== "promocode");
    const promos = locs.filter((row) => row.kind === "promocode").slice(0, 80);
    const selected = [...hubs, ...promos];

    for (const entry of selected) {
      try {
        const html = await fetchText(entry.url);
        pages.push({
          ...entry,
          title: extractTag(html, "title") || extractTag(html, "h1"),
          description: extractMeta(html, "description"),
          body: extractTag(html, "main") || plainText(html).slice(0, 4000),
        });
      } catch (error) {
        console.warn(`Skipping peer page ${entry.url}:`, error);
      }
    }
  }
  return pages;
}

async function loadLocalRows(): Promise<LocalRow[]> {
  const {
    db,
    stores,
    storeTranslations,
    brands,
    brandTranslations,
    categories,
    categoryTranslations,
    promocodes,
    promocodeTranslations,
  } = await import("../../lib/db");

  const [storeRows, brandRows, categoryRows, promoRows] = await Promise.all([
    db
      .select({
        entityId: stores.id,
        translationId: storeTranslations.id,
        language: storeTranslations.language,
        slug: storeTranslations.slug,
        name: storeTranslations.name,
        description: storeTranslations.description,
        shortSummary: storeTranslations.shortSummary,
        bodyHtml: storeTranslations.bodyHtml,
        metaTitle: storeTranslations.metaTitle,
        metaDescription: storeTranslations.metaDescription,
        faqJson: storeTranslations.faqJson,
      })
      .from(storeTranslations)
      .innerJoin(stores, eq(stores.id, storeTranslations.storeId))
      .where(eq(stores.isActive, true)),
    db
      .select({
        entityId: brands.id,
        translationId: brandTranslations.id,
        language: brandTranslations.language,
        slug: brandTranslations.slug,
        name: brandTranslations.name,
        description: brandTranslations.description,
        shortSummary: brandTranslations.shortSummary,
        bodyHtml: brandTranslations.bodyHtml,
        metaTitle: brandTranslations.metaTitle,
        metaDescription: brandTranslations.metaDescription,
        faqJson: brandTranslations.faqJson,
      })
      .from(brandTranslations)
      .innerJoin(brands, eq(brands.id, brandTranslations.brandId))
      .where(eq(brands.isActive, true)),
    db
      .select({
        entityId: categories.id,
        translationId: categoryTranslations.id,
        language: categoryTranslations.language,
        slug: categoryTranslations.slug,
        name: categoryTranslations.name,
        description: categoryTranslations.description,
        shortSummary: categoryTranslations.shortSummary,
        bodyHtml: categoryTranslations.bodyHtml,
        metaTitle: categoryTranslations.metaTitle,
        metaDescription: categoryTranslations.metaDescription,
        faqJson: categoryTranslations.faqJson,
      })
      .from(categoryTranslations)
      .innerJoin(categories, eq(categories.id, categoryTranslations.categoryId))
      .where(eq(categories.isActive, true)),
    db
      .select({
        entityId: promocodes.id,
        translationId: promocodeTranslations.id,
        language: promocodeTranslations.language,
        slug: promocodeTranslations.slug,
        name: promocodeTranslations.title,
        description: promocodeTranslations.shortDescription,
        shortSummary: promocodeTranslations.shortDescription,
        bodyHtml: promocodeTranslations.conditions,
        metaTitle: promocodeTranslations.metaTitle,
        metaDescription: promocodeTranslations.metaDescription,
        faqJson: promocodeTranslations.faqJson,
        howToHtml: promocodeTranslations.howToHtml,
        conditions: promocodeTranslations.conditions,
      })
      .from(promocodeTranslations)
      .innerJoin(promocodes, eq(promocodes.id, promocodeTranslations.promocodeId))
      .where(and(eq(promocodes.status, "active"))),
  ]);

  const mapEntity = (
    kind: EntityKind,
    rows: Array<{
      entityId: string;
      translationId: string;
      language: string;
      slug: string;
      name: string;
      description: string | null;
      shortSummary: string | null;
      bodyHtml: string | null;
      metaTitle: string | null;
      metaDescription: string | null;
      faqJson: unknown;
      howToHtml?: string | null;
      conditions?: string | null;
    }>
  ): LocalRow[] =>
    rows.map((row) => ({
      kind,
      locale: row.language as Locale,
      slug: row.slug,
      entityId: row.entityId,
      translationId: row.translationId,
      name: row.name,
      fields: {
        name: row.name,
        metaTitle: row.metaTitle,
        metaDescription: row.metaDescription,
        shortSummary: row.shortSummary,
        description: row.description,
        body: plainText(row.bodyHtml || row.description),
        faq: row.faqJson ? JSON.stringify(row.faqJson) : null,
        howTo: row.howToHtml ? plainText(row.howToHtml) : null,
        conditions: row.conditions ? plainText(row.conditions) : null,
      },
    }));

  return [
    ...mapEntity("store", storeRows),
    ...mapEntity("brand", brandRows),
    ...mapEntity("category", categoryRows),
    ...mapEntity("promocode", promoRows),
  ];
}

function findInternalDuplicates(localRows: LocalRow[]): InternalDup[] {
  const dups: InternalDup[] = [];
  const byKindLocale = new Map<string, LocalRow[]>();
  for (const row of localRows) {
    if (row.kind === "promocode") continue;
    const key = `${row.kind}:${row.locale}`;
    const list = byKindLocale.get(key) ?? [];
    list.push(row);
    byKindLocale.set(key, list);
  }

  for (const rows of byKindLocale.values()) {
    for (let i = 0; i < rows.length; i += 1) {
      for (let j = i + 1; j < rows.length; j += 1) {
        const left = rows[i];
        const right = rows[j];
        if (left.entityId === right.entityId) continue;
        const leftKey = normalizeSlugKey(left.slug);
        const rightKey = normalizeSlugKey(right.slug);
        if (leftKey && leftKey === rightKey) {
          dups.push({
            kind: left.kind,
            locale: left.locale,
            leftSlug: left.slug,
            rightSlug: right.slug,
            leftEntityId: left.entityId,
            rightEntityId: right.entityId,
            reason: "normalized-slug",
          });
          continue;
        }
        if (combinedSimilarity(left.name, right.name) >= 0.92) {
          dups.push({
            kind: left.kind,
            locale: left.locale,
            leftSlug: left.slug,
            rightSlug: right.slug,
            leftEntityId: left.entityId,
            rightEntityId: right.entityId,
            reason: "near-name",
          });
        }
      }
    }
  }
  return dups;
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  console.log(`Peer origin: ${PEER_ORIGIN}`);
  const [peerPages, localRows] = await Promise.all([loadPeerIndex(), loadLocalRows()]);
  console.log(`Peer pages fetched: ${peerPages.length}`);
  console.log(`Local translation rows: ${localRows.length}`);

  const localIndex = new Map<string, LocalRow[]>();
  for (const row of localRows) {
    const key = `${row.kind}:${row.locale}:${normalizeSlugKey(row.slug)}`;
    const list = localIndex.get(key) ?? [];
    list.push(row);
    localIndex.set(key, list);
  }

  const overlaps: OverlapRow[] = [];
  for (const peer of peerPages) {
    const key = `${peer.kind}:${peer.locale}:${normalizeSlugKey(peer.slug)}`;
    const matches = localIndex.get(key) ?? [];
    for (const local of matches) {
      const fields = compareFields(
        {
          metaTitle: local.fields.metaTitle,
          metaDescription: local.fields.metaDescription,
          shortSummary: local.fields.shortSummary,
          body: local.fields.body,
          name: local.fields.name,
        },
        {
          metaTitle: peer.title,
          metaDescription: peer.description,
          shortSummary: peer.description,
          body: peer.body,
          name: peer.title,
        }
      );
      const overallBucket = worstBucket(fields);
      const maxScore = Math.max(...fields.map((field) => field.score), 0);
      if (overallBucket === "unique" && maxScore < 0.65) continue;
      overlaps.push({
        kind: local.kind,
        locale: local.locale,
        localSlug: local.slug,
        peerSlug: peer.slug,
        peerUrl: peer.url,
        entityId: local.entityId,
        translationId: local.translationId,
        overallBucket,
        maxScore,
        fields,
      });
    }
  }

  const internalDuplicates = findInternalDuplicates(localRows);
  const summary = {
    generatedAt: new Date().toISOString(),
    peerOrigin: PEER_ORIGIN,
    peerPages: peerPages.length,
    localRows: localRows.length,
    overlapCounts: {
      exact: overlaps.filter((row) => row.overallBucket === "exact").length,
      nearDuplicate: overlaps.filter((row) => row.overallBucket === "near-duplicate").length,
      similar: overlaps.filter((row) => row.overallBucket === "similar").length,
      total: overlaps.length,
    },
    internalDuplicateCount: internalDuplicates.length,
  };

  const outDir = path.join(process.cwd(), "reports");
  await mkdir(outDir, { recursive: true });
  const reportPath = path.join(outDir, "cross-site-dupes.json");
  const manifestPath = path.join(outDir, "overlap-rewrite-manifest.json");

  const rewriteManifest = {
    profile: "promobozor-editorial",
    generatedAt: summary.generatedAt,
    translationIds: Array.from(
      new Set(
        overlaps
          .filter(
            (row) =>
              row.overallBucket === "exact" ||
              row.overallBucket === "near-duplicate" ||
              row.overallBucket === "similar"
          )
          .map((row) => row.translationId)
      )
    ),
    entityIds: Array.from(new Set(overlaps.map((row) => row.entityId))),
    internalDuplicates,
  };

  await writeFile(
    reportPath,
    JSON.stringify({ summary, overlaps, internalDuplicates }, null, 2),
    "utf8"
  );
  await writeFile(manifestPath, JSON.stringify(rewriteManifest, null, 2), "utf8");

  console.log(JSON.stringify(summary, null, 2));
  console.log(`Wrote ${reportPath}`);
  console.log(`Wrote ${manifestPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
