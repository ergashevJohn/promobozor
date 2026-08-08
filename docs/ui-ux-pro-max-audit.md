# PromoBozor — UI/UX Pro Max Audit

Sana: 2026-08-08  
Rubrika: `ui-ux-pro-max` Priority 1–10  
Diallar: Variance 7 · Motion 5 · Density 4

**Mahsulot:** Promocode / deal marketplace (UZ)  
**Stack:** Next.js App Router + Tailwind v4 + Phosphor

**Eslatma:** Skill `--design-system` purple (`#7C3AED`) + Rubik/Nunito taklif qildi. Brendga zid — **rad etildi**. Saqlanadi: cold monochrome + coral CTA + Manrope.

Mavjud visual taste: [`docs/ui-taste-audit.md`](ui-taste-audit.md).

---

## Scorecard

| P   | Category       | Verdict (audit) | Eng og‘ir                                               |
| --- | -------------- | --------------- | ------------------------------------------------------- |
| 1   | Accessibility  | FAIL            | Coral matn kontrast; desktop nav aria; inactive opacity |
| 2   | Touch          | FAIL            | Logo <44px; header gap-1; detail chips                  |
| 3   | Performance UX | WARN            | Skeleton ≠ deal-card                                    |
| 4   | Style          | PASS            | Phosphor; tokenlar                                      |
| 5   | Layout         | WARN            | Cream gradient qoldiq                                   |
| 6   | Type/Color     | WARN            | themeColor drift                                        |
| 7   | Animation      | PASS            | reduced-motion OK                                       |
| 8   | Forms          | FAIL            | ContactForm error focus                                 |
| 9   | Navigation     | PASS            | Skip-link; EN landmark WARN                             |
| 10  | Charts         | N/A             |                                                         |

---

## Amalga oshirilgan (shu PR)

1. Audit hujjat
2. P0: kontrast (badge/meta ink), nav `mainNav` aria, inactive card
3. P0: Header touch (logo hit area, gap-2), detail chips `min-h-11`
4. P0: ContactForm focus, mobile menu aria + i18n landmarks
5. P1: themeColor/cream, skeleton ritm, link focus, SearchBar aria-busy
6. P2: detailsHref cleanup, icon aria-hidden, Featured empty CTA, motion duration

**Status:** P0–P2 amalga oshirildi.
