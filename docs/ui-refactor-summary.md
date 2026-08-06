# PromoBozor UI refaktor xulosasi

Sana: 2026-08-06

## Topilgan asosiy muammolar

- Bir xil maqsaddagi yuzalar va boshqaruvlarda radius, soya hamda hover qoidalari turlicha edi.
- Filterlardagi native `select`lar to‘rt marta takrorlangan edi.
- Yuklanish kartalari asosiy dizayndan tashqaridagi `zinc` ranglari va boshqa radiuslardan foydalangan edi.
- Ayrim promocode CTA hover ranglari token emas, bevosita hex qiymat bilan yozilgan edi.

## Yangilangan dizayn tizimi

`app/globals.css`da mavjud brend palitrasi o‘zgartirilmasdan quyidagi tokenlar qo‘shildi:

- layout: maksimal kenglik, page gutter va section ritmi;
- component: control balandligi va control/surface/hero radiuslari;
- elevation: standart surface, hover va control soyalari;
- interaction: transition va z-index shkalasi.

Yangi umumiy utilitylar: `directory-card`, `field-control`, `skeleton-fill`.

## O‘zgargan umumiy komponentlar

- `Input` va `Textarea` yagona `field-control` asosiga o‘tdi.
- `Select` komponenti qo‘shildi va barcha promocode filtrlari shu komponentdan foydalanadi.
- Skeleton kartalar brend ranglari, surface radiuslari va haqiqiy card ritmiga moslashtirildi; yuklanish holati `aria-busy` bilan ifodalandi.
- Promocode action CTA’lari aksent foreground tokeniga o‘tkazildi.

## Yangilangan sahifalar

- Promocode listing: filter control va panel tizimi birlashtirildi.
- Stores, categories va brands: directory kartalar uchun bitta hover/elevation tili ishlatildi.
- Boshqa barcha public sahifalar mavjud `page-shell`, hero va surface utilitylari orqali yangi global tokenlarni meros qiladi.

## Responsive va accessibility tuzatishlari

- Barcha umumiy form control’lar bir xil minimal balandlik, kontrast va `:focus-visible` ringini oladi.
- Native selectlarda standart caret saqlandi; bu mobil va desktopda affordance’ni aniq ko‘rsatadi.
- Mobil menyu, 375 px promocode ko‘rinishi va desktop 1280 px ko‘rinishi brauzerda tekshirildi.
- Skip-link, keyboard trap va reduced-motion qo‘llovi mavjud holatda saqlandi.

## Muhim fayllar

- `app/globals.css`
- `components/ui/select.tsx`
- `components/ui/input.tsx`
- `components/ui/textarea.tsx`
- `components/ui/skeleton-card.tsx`
- `components/public/FilterBar.tsx`
- `components/public/StoresPageClient.tsx`
- `app/[locale]/(user)/categories/page.tsx`
- `app/[locale]/(user)/brands/page.tsx`

## Qolgan cheklovlar

- Dashboardga oid table, modal, drawer, tooltip va switch kabi komponentlar public kod bazasida mavjud emas; ular shu refaktor doirasida sun’iy ravishda qo‘shilmadi.
- `npm audit` 24 ta mavjud dependency zaifligini ko‘rsatadi. Ular UI o‘zgarishlaridan tashqari bo‘lgani uchun avtomatik yangilanmadi; keyingi ish GitHub issue [#3](https://github.com/ergashevJohn/promobozor/issues/3)da qayd etildi.
