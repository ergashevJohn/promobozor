# SEO operations playbook (E-E-A-T + off-page)

This complements on-site SEO work for promokoduz.uz vs competitor brand-hub coverage.

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

1. Verify property for `https://promokoduz.uz`
2. Submit sitemaps: `/sitemap/uz.xml`, `/sitemap/ru.xml`, `/sitemap/en.xml`
3. Inspect sample `/promokod/{brand}` aliases — they must 301 to store/brand hubs
4. Monitor Coverage for soft-404s on expired promocode URLs (should be noindex)
5. In Yandex Webmaster, mirror sitemap submission and check “Некачественные страницы”

## Telegram / social proof

- Keep https://t.me/promokoduz_app linked from footer, about, and `llms.txt`
- Post verified deal roundups with deep links to store/brand hubs (not only single promocode URLs)
- Prefer hub URLs (`/uz/store/...`, `/uz/brand/...`) for evergreen link equity

## Internal linking

- Blog guides link to related store/brand hubs
- Hub pages include visible FAQ matching FAQ JSON-LD
- Active promocode pages include visible HowTo matching HowTo JSON-LD
