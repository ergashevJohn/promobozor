# SEO operations playbook (E-E-A-T + off-page)

This complements on-site SEO work for promobozor.uz vs competitor brand-hub coverage.

## Localized URL segments

Public paths are locale-specific (internal App Router keys stay English):

| Entity           | uz                   | ru                   | en                 |
| ---------------- | -------------------- | -------------------- | ------------------ |
| Promocode detail | `/chegirma/[slug]`   | `/promokod/[slug]`   | `/deal/[slug]`     |
| Promocode list   | `/chegirmalar`       | `/promokody`         | `/deals`           |
| Store detail     | `/do-kon/[slug]`     | `/magazin/[slug]`    | `/store/[slug]`    |
| Store list       | `/do-konlar`         | `/magaziny`          | `/stores`          |
| Category detail  | `/kategoriya/[slug]` | `/kategoriya/[slug]` | `/category/[slug]` |
| Brand detail     | `/brend/[slug]`      | `/brend/[slug]`      | `/brand/[slug]`    |

Legacy English paths (`/promocode/…`, `/store/…`, …) 301 to localized segments via `proxy.ts` and the `redirects` table.

Slug migrations were applied once (2026). Legacy paths continue to 301 via the `redirects` table and `proxy.ts`. Do not re-run the removed `scripts/migrations/` tooling — restore from git history only if needed.

## Claims vs inventory

- Never publish inflated store/promocode/user counts on About, OG, or `llms.txt`.
- About page stats should come from live DB counts (active stores, categories, active promocodes).
- If a metric is unknown (e.g. daily users), omit it or describe qualitatively.

## Inventory quality bar

- Floor: 150 active, verified promocodes
- Target: 300 active, verified promocodes
- Prefer fewer real codes over invented codes
- Empty store/brand hubs stay `noindex,follow` until they have active offers
- Run: `npx tsx scripts/seo/inventory-gap-report.ts`
- Upsert hub copy only: `npx tsx scripts/seo/upsert-hub-editorial.ts`

## Canonical host

- Production canonical: `https://www.promobozor.uz`
- Set `NEXT_PUBLIC_BASE_URL=https://www.promobozor.uz`
- Apex (`https://promobozor.uz`) and HTTP must 301 in one hop to `www` (Vercel/Cloudflare) — no redirect loops with trailing slash
- GSC/Yandex property should match the www host

## Soft positioning (PromoBozor role)

- Homepage/about/FAQ/footer/`llms.txt`: compare offers, explain conditions, pick a verified option
- Shared social (`@promokoduz_app`) stays, with explicit “shared network for two separate projects” disclosure in uz/ru/en
- Do not center messaging on “fast promo catalog”

## Cross-site / internal duplicate tooling

```bash
npm run seo:compare-sites          # peer sitemaps + local DB → reports/cross-site-dupes.json + overlap manifest
npm run seo:rewrite-existing -- --overlap-report=reports/overlap-rewrite-manifest.json
npx tsx scripts/seo/merge-internal-duplicates.ts   # dry-run merge plan from internalDuplicates
```

- Auto-merge only same-type hubs after human review (`--apply --pair=canonicalId:duplicateId`)
- Never auto-merge cross-type store↔brand pairs
- RU deal slugs must not end with `-promokod` / `-promocode` (alias 301 collision)

## Google Search Console / Yandex

1. Verify property for `https://www.promobozor.uz` (or current `NEXT_PUBLIC_BASE_URL`)
2. Submit sitemaps: `/sitemap/uz.xml`, `/sitemap/ru.xml`, `/sitemap/en.xml`
3. Inspect sample competitor aliases (`/{locale}/promokod/{brand}-promokod`) — they must 301 to store/brand hubs
4. Monitor Coverage for soft-404s on expired promocode URLs (should be noindex)
5. In Yandex Webmaster, mirror sitemap submission and check “Некачественные страницы”
6. After content rewrite rollout, watch duplicate canonical, crawled-currently-not-indexed, and old URL redirects for 2–4 weeks

## Telegram / social proof

- Keep https://t.me/promokoduz_app linked from footer, about, and `llms.txt`
- Disclose that channels are a shared network for PromoBozor and Promokoduz (separate sites)
- Post verified deal roundups with deep links to store/brand hubs (not only single promocode URLs)
- Prefer hub URLs (`/uz/do-kon/...`, `/uz/brend/...`) for evergreen link equity
- Use compare-oriented anchors: “solishtirish”, “shartlarni tekshirish”, “alternativlar”

## Internal linking

- Blog guides link to related store/brand hubs
- Hub pages include visible FAQ matching FAQ JSON-LD
- Active promocode pages include visible HowTo matching HowTo JSON-LD

## Filtered listings

- Query-filtered promocode lists keep `X-Robots-Tag: noindex, follow`
- Proxy also emits `Link: <clean-list-url>; rel="canonical"` for those filtered URLs
