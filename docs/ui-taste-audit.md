# PromoBozor UI Taste Audit

Sana: 2026-08-07  
Rubrika: `design-taste-frontend` Pre-Flight (§14)

**Design Read:** Consumer promocode marketplace (UZ) for trust-first shoppers; prior language was warm cream + coral coupon aesthetic on Tailwind v4 + shadcn; leaning toward AI-default “premium savings” cluster rather than a distinctive PromoBozor voice.

**Diallar (audit vaqti):** `DESIGN_VARIANCE: 6` · `MOTION_INTENSITY: 4` · `VISUAL_DENSITY: 7`  
**Target:** `7 / 5 / 4`

---

## Nima yaxshi (saqlangan)

- Fontlar: Manrope + JetBrains Mono (`next/font`) — Inter emas
- Purple/indigo gradient yo‘q; Phosphor ikonlar
- Hero left-aligned, 2-col composition
- Tokenlar markazlashgan (`deal-card`, `directory-card`, `page-shell`)
- Dark mode: `next-themes` + `.dark` tokenlar
- Reduced-motion CSS, skip-link
- SEO schema komponentlari (tegmaslik)

---

## Pre-Flight skor (audit vaqti)

| Check                            | Holat |
| -------------------------------- | ----- |
| Palette ban (cream+coral canvas) | FAIL  |
| Eyebrow count                    | FAIL  |
| Hero stack / clutter             | FAIL  |
| Em-dash zero                     | FAIL  |
| Duplicate CTA intent             | FAIL  |
| Trust chips in hero              | FAIL  |
| Theme lock                       | PASS  |
| Inter / purple                   | PASS  |
| Serif discipline                 | PASS  |
| Cards-only hierarchy             | FAIL  |
| Section layout diversity         | WEAK  |
| Real images                      | WEAK  |

**Verdict:** Funksional UI bor, lekin taste rubrikasida shipping-ready emas edi.

---

## P0 — Pre-Flight Fail

1. **Warm cream + terracotta canvas** — `#f7f5f2` / `#fffcf9` / `#e4dfd8` + coral wash. Cold monochrome canvas + brand accent lock.
2. **`brand-kicker` spam** — deyarli har home/entity sectionda. Max `ceil(n/3)`.
3. **Hero clutter** — kicker + label ×2 + H1 + subtitle + search + 4 pills + aside metrics + trust chips. Max 4 text element.
4. **Em-dash (`—`)** — meta, FAQ, Header alt, entity descriptions.
5. **Duplicate detail CTA** — title link + “Batafsil” button bir intent.

## P1 — Composition

- Detail stats/discount/store nomi takrori
- Store/category/brand clone layout
- Soxta `index < 3` featured badge
- Directory CTA nomuvofiqligi
- Deal-card density
- Image pipeline drift (`getApprovedImageUrl` vs detail)
- Dead home components (`HomeFreshnessProof`, `HomeSEOContent`)
- Docs / `components.json` iconLibrary drift

## P2 — Polish

- ContactForm error focus
- Skeleton ↔ card ritm
- Dark mode gradient parity
- Fake-precise FAQ stats (`94.7%`)

---

## Amalga oshirilgan yo‘nalish (shu PR)

1. Cold monochrome canvas + radius/shadow lock (`app/globals.css`)
2. Hero simplify + trust section pastga (`HomeTrustStrip`)
3. Eyebrow cull (home + entity)
4. Em-dash / AI jargon copy sweep (uz/ru/en)
5. Deal card CTA dedup + density slim
6. PromocodeDetail + entity layout diversity
7. Directory CTA + fake featured unify
8. Dead code cleanup (`HomeFreshnessProof`, `HomeSEOContent`) + docs sync

**Status:** P0 + P1 amalga oshirildi (2026-08-08).
