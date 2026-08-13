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

## Google Search Console / Yandex

1. Verify property for `https://promobozor.uz` (or current `NEXT_PUBLIC_BASE_URL`)
2. Submit sitemaps: `/sitemap/uz.xml`, `/sitemap/ru.xml`, `/sitemap/en.xml`
3. Inspect sample competitor aliases (`/{locale}/promokod/{brand}-promokod`) — they must 301 to store/brand hubs
4. Monitor Coverage for soft-404s on expired promocode URLs (should be noindex)
5. In Yandex Webmaster, mirror sitemap submission and check “Некачественные страницы”

## Telegram / social proof

- Keep https://t.me/promokoduz_app linked from footer, about, and `llms.txt`
- Post verified deal roundups with deep links to store/brand hubs (not only single promocode URLs)
- Prefer hub URLs (`/uz/do-kon/...`, `/uz/brend/...`) for evergreen link equity

## Internal linking

- Blog guides link to related store/brand hubs
- Hub pages include visible FAQ matching FAQ JSON-LD
- Active promocode pages include visible HowTo matching HowTo JSON-LD
