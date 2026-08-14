# Tier-2 / Tier-3 content ops

## Maqsad

Tier-1 (hub + bog‘langan promo + top category) dan keyin qolgan active entitylarni to‘ldirish va freshness saqlash.

## Tier-2 checklist (3–6 hafta)

1. Qolgan active store/brand: meta + `shortSummary` + `bodyHtml` ≥120 so‘z (uz/ru/en).
2. Featured / yuqori `copyCount` promocodes — to‘liq P0 gate (`scripts/seo/CONTENT_STANDARDS.md`).
3. Qolgan category hub’lar — intro + FAQ.
4. Haftalik: `npm run seo:gap-report` — `missingMeta` / `missingBody` (so‘z floor) / `missingFaq` (≥3) / `missingReview` ni 0 ga yaqinlashtirish. `lastVerifiedAt` faqat haqiqiy verify bilan yangilanadi.

## Verify ritmi

| Ish               | Chastota | Buyruq / amal                                 |
| ----------------- | -------- | --------------------------------------------- |
| Top 50 hub verify | 3–7 kun  | `lastReviewedAt` / `lastVerifiedAt` yangilash |
| Expired tozalash  | Kunlik   | status → `expired` / yashirish                |
| Gap report        | Haftalik | `npm run seo:gap-report`                      |
| Category refresh  | Chorakda | `bodyHtml` + FAQ qayta yozish                 |

## Publish gate (yangi entity)

Bir entity uchun **uch til birga** yopiladi (uz+ru+en). Bitta til bo‘sh qolsa — publish qilinmasin.
