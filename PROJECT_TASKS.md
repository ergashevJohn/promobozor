# PromoBozor Task Manager

Last updated: 2026-04-29

## Workflow

- `Backlog`: hali boshlanmagan ishlar
- `In Progress`: ustida ishlanayotgan ishlar
- `Review`: tugagan, lekin qayta ko'rib chiqilishi kerak bo'lgan ishlar
- `Done`: yakunlangan ishlar

## Comparison Notes

Audit basis:

- Live old site reviewed against `https://www.promokoduz.uz/en` on April 29, 2026
- Current local project homepage and core public routes compared visually and structurally

Main findings:

- Hozirgi loyiha eski saytdan rang, polish va branding tarafidan farq qiladi, lekin asosiy `info architecture` hali juda o'xshash
- Homepage hali ham eski oqimga yaqin: `hero -> trust/value -> stores -> categories -> brands -> how it works -> stats -> trust -> faq -> footer`
- Eski saytdagi “coupon directory” hissi hali ham ba'zi bloklarda saqlanib qolgan; yangi loyiha undan ko'ra ko'proq `smart savings platform` taassurotini berishi kerak
- Store / category / brand / promocode page templatelari hali bir-biriga yaqin, ular o'z intenti bo'yicha kuchliroq farqlanishi kerak
- SEO bazasi yaxshi: metadata, sitemap, schema, hreflang bor; lekin sahifa intenti, copy depth, internal linking va unique content qatlamlari hali yetarli darajada agressiv emas
- Conversion elementlar bor, lekin “best deal discovery”, “why trust this offer”, “freshness”, “verification confidence” signalari yanada aniqroq ko'rsatilishi kerak

## Backlog

### PB-23 Migrate Open Graph routes from Edge Runtime

Priority: Medium
Status: Done
Issue: https://github.com/ergashevJohn/promobozor/issues/4
Notes: Har ikkala Open Graph image generator `nodejs` runtime'iga o'tkazildi. Production build muvaffaqiyatli yakunlandi va Edge Runtime deprecation ogohlantirishi qaytmadi.

### PB-22 Remediate dependency vulnerabilities

Priority: High
Status: Done
Issue: https://github.com/ergashevJohn/promobozor/issues/3
Notes: Next, Drizzle, PostCSS, sanitize-html, Vitest va transitive toolchain dependencylari yangilandi. `npm audit` 0 ta zaiflik qaytaryapti; test, type-check, lint va production build muvaffaqiyatli yakunlandi.

### PB-21 Validate catalogue media assets

Priority: High
Status: Done
Issue: https://github.com/ergashevJohn/promobozor/issues/2
Notes: Noto'g'ri `cdn.example.com` kategoriya rasmi seed va ma'lumotlar migratsiyasidan olib tashlandi. Public kataloglarda faqat local yoki ImageKit URL'lari render qilinadi; qolgan qiymatlar mavjud icon fallback'ini ko'rsatadi.

### PB-20 Replace inherited social handles

Priority: High
Status: Done
Issue: https://github.com/ergashevJohn/promobozor/issues/1
Notes: Owner qaroriga ko‘ra `promokoduz_app` URL’lari PromoBozor’ning amaldagi rasmiy kanallari sifatida saqlandi. Public label va crawler matnlarida ular PromoBozor kanallari sifatida aniq ko‘rsatildi.

### PB-08 Full Visual & IA Overhaul Plan

Priority: High
Status: Done
Notes: eski live sayt va hozirgi loyiha strukturasiga tayangan holda yangi IA yo'nalishi hujjatlashtirildi; qarang `docs/overhaul-ia-plan.md`

- [ ] Homepage uchun yangi `information architecture` ishlab chiqish
- [ ] Eski saytga o'xshab qolayotgan section ketma-ketligini qayta qurish
- [ ] “coupon catalog” hissidan “smart savings / trusted deals platform” hissiga o'tish
- [ ] Desktop va mobile uchun yangi visual hierarchy planini belgilash
- [ ] Yangi section prioritetlari: discovery, trust, freshness, verification, conversion

### PB-09 Design System 2.0

Priority: High
Status: Done
Notes: implementationdan oldingi design system 2.0 spec tayyorlandi; qarang `docs/design-system-2.0.md`

- [ ] Yangi spacing, radius, shadow va surface scale belgilash
- [ ] Typography hierarchy'ni section va page intent bo'yicha qayta qurish
- [ ] Iconography, badge va status language'ni yagona tizimga o'tkazish
- [ ] Homepage va listinglar uchun yangi card variants yaratish
- [ ] Subtle motion, hover va reveal patterns belgilash

### PB-10 Homepage Redesign From Structure Up

Priority: High
Status: Done
Notes: homepage section order, differentiating modules, stronger discovery flow va browse block differentiation yakunlandi; deeper discovery iterationlar keyingi `PB-11` va `PB-12` tasklarda davom etadi

- [ ] Hero section'ni yangi narrative va stronger CTA bilan qayta dizayn qilish
- [ ] Search experience'ni markaziy value proposition sifatida kuchaytirish
- [ ] Featured / latest / verified takliflar bloklarini yangicha formatlash
- [ ] Stores / categories / brands bloklarini bir xil katalog ko'rinishidan chiqarish
- [ ] Stats, trust, FAQ va editorial block order'ni yangidan tuzish
- [ ] Homepage uchun kamida 2 ta yangi differentiating module qo'shish

### PB-11 Listing & Discovery UX Redesign

Priority: High
Status: Done
Notes: `promocodes`, `stores`, `brands` va `categories` listinglari discovery-first shell, stronger card hierarchy, localized filter UX, conversion-friendly empty/low-result holatlari va `fresh / verified / popular / ending soon` signal pass bilan yakunlandi

- [ ] `promocodes`, `stores`, `brands`, `categories` listing page layouts'ni qayta dizayn qilish
- [ ] Search/filter/sort panelni yanada premium va tez ishlatiladigan qilish
- [ ] Grid/list card hierarchies'ni intent bo'yicha farqlash
- [ ] Empty, no-match, low-result states'ni conversion-friendly qilish
- [ ] “fresh”, “verified”, “popular”, “ending soon” signal sistemalarini kuchaytirish

### PB-12 Entity Page Template Differentiation

Priority: High
Status: Done
Notes: `store`, `brand`, `category` va `promocode detail` sahifalari intent bo'yicha farqlashtirildi; hero/summary, proof bloklari va entity-to-entity internal linking UX kuchaytirildi

- [ ] Store page'larni “best place to save at this store” formatiga o'tkazish
- [ ] Category page'larni “market overview + best offers” formatida kuchaytirish
- [ ] Brand page'larni “brand-focused curated offers” hissi bilan qayta qurish
- [ ] Promocode detail page'larda trust, usage, expiry, proof signalini kuchaytirish
- [ ] Related offers / related entities internal linking UX'ini yaxshilash

### PB-13 Promo Card & CTA System Rebuild

Priority: High
Status: Done
Notes: promo kartalar discovery-first layout, dual CTA, stronger trust/reveal cues va mobile-friendly action sizing bilan qayta qurildi; client, optimized va server variantlar bir xil tizimga keltirildi

- [ ] Promo card layout'ni to'liq qayta ko'rib chiqish
- [ ] `code` va `deal` variantlari uchun alohida CTA treatment yaratish
- [ ] Verification, freshness, expiry va source trust cues'ni ko'rsatish
- [ ] Copy / reveal / copy-success interaction'larni qayta dizayn qilish
- [ ] Mobile card readability va tap targets'ni kuchaytirish

### PB-14 SEO Architecture V2

Priority: High
Status: Backlog
Notes: texnik SEO bazasi bor; keyingi bosqich intent, uniqueness va page depth'ni kuchaytirish

- [ ] Homepage, listing va entity page title/description strategy'ni qayta yozish
- [ ] Thin intro copy'larni stronger search-intent copy bilan almashtirish
- [ ] Store/category/brand pages uchun unique editorial intro templates yaratish
- [ ] Internal linking strategiyasini `stores <-> categories <-> brands <-> promocodes` bo'yicha kuchaytirish
- [ ] FAQ, HowTo, ItemList, CollectionPage schema qo'llanishini qayta audit qilish
- [ ] Canonical, filtered pages va indexability qoidalarini yana bir bor review qilish

### PB-15 Content Depth & Editorial Layer

Priority: Medium
Status: Backlog
Notes: eski sayt va hozirgi loyiha orasidagi asosiy farqlardan biri kontent authority bo'lishi kerak

- [ ] Homepage uchun yangi editorial copy framework yozish
- [ ] Store/category/brand page'lar uchun reusable content block system yaratish
- [ ] “How to save”, “best time to use”, “terms to know” kabi useful helper modules qo'shish
- [ ] Local market intent uchun UZ/RU/EN copy strategy'ni mustahkamlash
- [ ] E-E-A-T signal beruvchi trust copy va methodology block'larni kengaytirish

### PB-16 Trust, Conversion & Proof Layer

Priority: Medium
Status: Backlog
Notes: foydalanuvchi “bu taklif ishlaydimi?” degan savolga maksimal tez javob olishi kerak

- [ ] Verification process signalini UI ichida kuchaytirish
- [ ] “last checked”, “success rate”, “community feedback” kabi proof elementlar uchun design system yaratish
- [ ] CTA oldidagi friction'ni kamaytirish
- [ ] “copy”, “get deal”, “view store deals” action hierarchy'ni qayta belgilash
- [ ] User trust banners va inline proof modules'ni test qilish

### PB-17 Visual Content & Asset Direction

Priority: Medium
Status: Backlog
Notes: custom imagery yo'qligi sabab sayt hali ko'proq generic UI hissini beradi

- [ ] PromoBozor uchun lightweight illustration / shape / decorative asset system yaratish
- [ ] Homepage va static pages uchun visual anchors tayyorlash
- [ ] OG image templates'ni page-type bo'yicha boyitish
- [ ] Store/category/brand placeholders'ni premiumroq tizimga o'tkazish

### PB-18 Performance, Accessibility & Technical UX Pass

Priority: Medium
Status: Backlog
Notes: to'liq redesign bilan birga UX sifati faqat chiroy emas, tezlik va accessibility bilan ham mustahkamlanishi kerak

- [ ] New UI'dan keyin Core Web Vitals audit qilish
- [ ] Mobile interaction, keyboard flow va focus states'ni audit qilish
- [ ] Image/content loading skeleton va perceived performance layer qo'shish
- [ ] Accessibility contrast, aria va semantic structure review qilish

### PB-19 Measurement & Experiment Readiness

Priority: Medium
Status: Backlog
Notes: redesign natijasi o'lchanmasa, qaysi o'zgarish foyda berganini bilish qiyin bo'ladi

- [ ] Homepage search, CTA, copy va scroll depth eventlarini qayta ko'rib chiqish
- [ ] Best converting modules uchun analytics hooks tayyorlash
- [ ] Key funnel'lar: search -> open offer -> copy/get deal -> outbound click uchun event map tuzish
- [ ] Kelajakdagi A/B testlar uchun component-level experiment points belgilash

### PB-05 Content & Trust Pass

Priority: Medium
Status: Done
Notes: homepage trust copy, listing CTA matnlari, empty states va about/faq wording browserda spot-check qilindi, regressiya topilmadi

- [ ] Homepage trust blocks copy pass
- [ ] Store/category/brand page CTA copy pass
- [ ] Empty states copy refinement
- [ ] About / FAQ content wording cleanup

### PB-06 Assets & SEO Cleanup

Priority: Medium
Status: Done
Notes: android/app icon set yaratildi, metadata/schema/llms/OG qatlamidagi ichki brand reference'lar tozalandi; browser/build pass toza o'tdi, tashqi social handle URL'lari ataylab o'z holicha qoldirildi

- [ ] Favicon/icon assetlarini yangi logoga to'liq moslashtirish
- [ ] Remaining PromoBozor/old brand technical references audit
- [ ] OG image visual refinement
- [ ] Manifest / app icon validation

### PB-07 Admin Branding Pass

Priority: Medium
Status: Done
Notes: admin layout, login, dashboard, listing va create/edit form shell'lari PromoBozor admin visual tizimiga o'tkazildi; browser spot-check paytida admin login cookie banner overlap'i tuzatildi

- [ ] Admin header/footer/title pass
- [ ] Admin form spacing/color consistency
- [ ] Empty/loading states alignment

## Review

### PB-03 Static Content Page Polish

Priority: High
Status: Done
Notes: `about`, `faq`, `contact`, `privacy`, `terms` sahifalari PromoBozor visual systemida browserda spot-check qilindi

- [ ] About page hero, cards, founder block polish
- [ ] FAQ page layout refresh
- [ ] Contact page info cards + form polish
- [ ] Privacy page content sections polish
- [ ] Terms page content sections polish

### PB-02 Public Page Layout Polish

Priority: High
Status: Done
Notes: listing, detail va entity sahifalarining umumiy layout polish ishi browser spot-check bilan tasdiqlandi

- [ ] Store listing polish
- [ ] Brand listing polish
- [ ] Category listing polish
- [ ] Store detail hero + metrics polish
- [ ] Brand detail hero + metrics polish
- [ ] Category detail hero + metrics polish
- [ ] Filter bar visual refresh
- [ ] Empty state system refresh

## Done

### PB-04 Public UI Audit

Priority: High
Status: Done
Notes: real browser pass bajarildi; mobile consent banner overlap muammosi tuzatildi

- [ ] Search/filter UX audit
- [ ] Button and badge consistency audit
- [ ] Spacing and typography consistency audit
- [ ] Mobile overflow and wrapping audit

### PB-01 Core Rebrand

Priority: High
Status: Done
Notes: asosiy public brend qatlamini PromoBozor ga o'tkazish

- [ ] Logo integration
- [ ] Global color and surface tokens
- [ ] Header/footer rebrand
- [ ] Hero/search rebrand
- [ ] Promo cards visual refresh
- [ ] Metadata and structured data rebrand
