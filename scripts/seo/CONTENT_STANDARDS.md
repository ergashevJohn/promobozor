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

- **uz:** `{Entity} promokodlari — solishtirish va shartlar`
- **ru:** `Промокоды {Entity} — сравнение и условия`
- **en:** `{Entity} Promo Codes — Compare Verified Deals`

Bir title’da 1 primary + ixtiyoriy yil/sana.

## Site voice

- Profil: `promobozor-editorial` (`lib/seo/site-voice.ts`)
- Framing: solishtirish + shartlar + tekshirilgan tanlov (tez katalog da’vosi markazda emas)
- Ijtimoiy tarmoqlar: umumiy network disclosure (PromoBozor ≠ Promokoduz)

## Intent kalit so‘zlar

- uz: promokod, chegirma, kupon, solishtirish, shartlar, UZS, Click/Payme (kontekstda)
- ru: промокод, купон, скидка, сравнение, условия
- en: promo code, coupon, compare, conditions, verified + “Uzbekistan / UZS” bir jumla

## Anti-thin

- Store/category `bodyHtml` ≥150 so‘z, brand ≥120 so‘z — gap report va rewrite shu floor bilan o‘lchaydi (80 belgi emas)
- 100% template FAQ taqiqlanadi — kamida ~30% noyob savol/javob
- Generic “great online deals” taqiqlanadi
- Expired/disabled aniq belgilansin / indekslanmasin
- `lastVerifiedAt` / `lastReviewedAt` faqat haqiqiy review/verify da yangilanadi
- Yolg‘on son yoki isbotsiz “har kuni tekshirildi” da’volari yo‘q

## GEO / AI citation format

1. Bir jumlalik fakt: chegirma + kod/tur + muddat + oxirgi tekshiruv
2. Numbered how-to (3–5)
3. FAQ javoblari 40–80 so‘z
4. Shartlar bullet (min order, exclusions)
5. Solishtirish checklist (foyda / muddat / cheklov)

## Verify ritmi (Tier 2/3 ops)

| Ish                             | Chastota      |
| ------------------------------- | ------------- |
| Top 50 store / hot promo verify | Har 3–7 kun   |
| Expired/disabled tozalash       | Kunlik        |
| `npm run seo:gap-report`        | Haftalik      |
| `npm run seo:compare-sites`     | Overlap oldin |
| Category intro refresh          | Chorakda      |

## Skriptlar

```bash
# Agar drizzle-kit migrate 0020 ni qo‘llamasa:
npx tsx scripts/seo/apply-0020-migration.ts

npm run db:migrate                 # schema (0020_content_seo_fields)
npm run seo:compare-sites          # peer vs local overlap + internal URL dups
npm run seo:upsert-hub             # Tier-1 hub body/meta/faq
npm run seo:enrich-tier1           # hub + bog‘langan/unverified promo + top category
npm run seo:rewrite-existing       # dry-run (default); --overlap-report / --apply
npm run seo:rewrite-existing:apply # existing data asosidagi rewrite'ni DBga qo‘llash
npx tsx scripts/seo/merge-internal-duplicates.ts  # internal hub merge dry-run
npm run seo:gap-report             # inventory + content gaps
npm run seo:verify -- <urls...>    # indexability smoke
```
