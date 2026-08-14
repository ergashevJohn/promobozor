# PromoBozor — DB Content SEO Standards

Til strategiyasi: **uz + ru + en teng**. Har locale mustaqil matn (copy-paste tarjima taqiqlanadi).

## Editorial gate (publish oldin)

| Entity    | Majburiy (har locale)                                                                                                      |
| --------- | -------------------------------------------------------------------------------------------------------------------------- |
| Store     | `metaTitle`, `metaDescription`, `shortSummary`, `bodyHtml` ≥150 so‘z, ≥3 FAQ (`faqJson`, kamida 1 noyob), `lastReviewedAt` |
| Category  | meta\*, `shortSummary`, `bodyHtml` ≥150 so‘z, ≥3 FAQ                                                                       |
| Brand     | meta\*, `shortSummary`, `bodyHtml` ≥120 so‘z, ≥2 FAQ                                                                       |
| Promocode | meta\*, `shortDescription`, to‘liq `conditions`, `howToHtml` yoki qadamlar, `expiresAt`, `lastVerifiedAt` ≤14 kun          |

## Title / H1 pattern (stuffing yo‘q)

- **uz:** `{Entity} promokodlari — faol chegirma va kuponlar`
- **ru:** `Промокоды {Entity} — купоны и скидки`
- **en:** `{Entity} Promo Codes & Coupons — Verified Deals`

Bir title’da 1 primary + ixtiyoriy yil/sana.

## Intent kalit so‘zlar

- uz: promokod, chegirma, kupon, UZS, Click/Payme (kontekstda)
- ru: промокод, купон, скидка
- en: promo code, coupon, verified + “Uzbekistan / UZS” bir jumla

## Anti-thin

- Store/category `bodyHtml` ≥150 so‘z, brand ≥120 so‘z — gap report va rewrite shu floor bilan o‘lchaydi (80 belgi emas)
- 100% template FAQ taqiqlanadi — kamida ~30% noyob savol/javob
- Generic “great online deals” taqiqlanadi
- Expired/disabled aniq belgilansin / indekslanmasin
- `lastVerifiedAt` / `lastReviewedAt` faqat haqiqiy review/verify da yangilanadi

## GEO / AI citation format

1. Bir jumlalik fakt: chegirma + kod/tur + muddat + oxirgi tekshiruv
2. Numbered how-to (3–5)
3. FAQ javoblari 40–80 so‘z
4. Shartlar bullet (min order, exclusions)

## Verify ritmi (Tier 2/3 ops)

| Ish                             | Chastota    |
| ------------------------------- | ----------- |
| Top 50 store / hot promo verify | Har 3–7 kun |
| Expired/disabled tozalash       | Kunlik      |
| `npm run seo:gap-report`        | Haftalik    |
| Category intro refresh          | Chorakda    |

## Skriptlar

```bash
# Agar drizzle-kit migrate 0020 ni qo‘llamasa:
npx tsx scripts/seo/apply-0020-migration.ts

npm run db:migrate                 # schema (0020_content_seo_fields)
npm run seo:upsert-hub             # Tier-1 hub body/meta/faq
npm run seo:enrich-tier1           # hub + bog‘langan/unverified promo + top category
npm run seo:rewrite-existing       # barcha mavjud row uchun dry-run preview
npm run seo:rewrite-existing:apply # existing data asosidagi rewrite'ni DBga qo‘llash
npm run seo:gap-report             # inventory + content gaps
```
