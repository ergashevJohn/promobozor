# PromoBozor UI auditi

Sana: 2026-08-06

## 1. Global muammolar

- Ranglar asosan `app/globals.css`da to‘g‘ri markazlashtirilgan, biroq ayrim komponentlarda aksent hover rangi (`#b83a33`) va soya ranglari bevosita yozilgan.
- Radius va soya qiymatlari bir xil rolga ega bo‘lgan yuzalarda turlicha: `rounded-xl`, `rounded-2xl`, `22px`, `24px`, `28px`, `32px` hamda turli arbitrar soyalar aralashgan.
- `page-shell` Tailwind `container`ga tayanadi; aniq maksimal kenglik va qo‘llaniladigan gorizontal oraliq alohida token sifatida belgilanmagan.
- Boshqaruv balandliklari ko‘p joyda 40, 44, 48 va 56 px tarzida komponent ichida qayta berilgan.

## 2. Umumiy komponentlar muammolari

- `FilterBar`dagi to‘rtta `select` mustaqil klasslar bilan bezatilgan; umumiy `Select` komponenti yo‘q.
- `GrouponCardServer` va `GrouponCardActions` asosiy CTA uchun `Button`dan tashqari takroriy, hardcode qilingan rangli klasslardan foydalanadi.
- `SkeletonCard` eski `zinc` ranglariga va boshqa radius tiliga tayanadi, shu sabab yuklanish holati asosiy yuzalardan ajralib turadi.
- Card, filter, pagination va qidiruv yuzalarida soya/radius hamda hover qoidalari bir joyda yig‘ilmagan.
- `Card` semantik `div` sifatida qolmoqda; sahifalardagi asosiy mazmunli kartalar `article`/`section` bilan o‘ralgan bo‘lishi kerak (mavjud promocode kartasida bu yaxshi bajarilgan).

## 3. Sahifaga xos muammolar

- `/promocodes` saralash paneli va natija sarlavhasi boshqa sahifalardagi hero/panel ritmiga nisbatan zichroq.
- `/stores` qidiruvi va store kartalari maxsus soya/radiuslar bilan yozilgan, directory kartalaridan biroz farq qiladi.
- `/categories` va `/brands` o‘xshash directory kartani mustaqil klasslar bilan takrorlaydi.
- Store, brand va category detail sahifalarida hero sarlavhalari `page-hero-heading` o‘rniga qisman lokal klasslardan foydalanadi.
- Statik ma’lumot sahifalarida (`about`, `faq`, `privacy`, `terms`, `contact`) bir xil panel ritmi bor, biroq bo‘lim oraliqlari ko‘pincha lokal `mb-*` bilan boshqariladi.

## 4. Responsive muammolar

- Umumiy layout mobil xavfsiz hudud va `100dvh`dan foydalanadi; bu yaxshi.
- Filterlardagi native `select`lar bir xil responsiv komponentga birlashtirilmagani uchun kichik ekranlarda balandlik va fokus ko‘rinishi drift qilishi mumkin.
- Katta card gridlarida yuklanish skeleti real kartaning o‘lcham/radius ritmini to‘liq aks ettirmaydi.
- Mobil navigatsiya fokusni ushlaydi va viewportga sig‘adi; buning ustiga asosiy navigatsiya/fokus holatlarini shared tokenlar bilan bir xil ko‘rinishga keltirish kerak.

## 5. Accessibility muammolari

- `ContactForm` telefon xatosini inline chiqaradi, lekin yuborishda fokus birinchi xatoga ko‘chmaydi.
- Barcha `select`larda fokus ringi bor, ammo native select uchun umumiy `color` va `background-color` kontrakti markazlashtirilmagan.
- Yuklanish skeletoni ekran o‘quvchi uchun holatni e’lon qilmaydi.
- Skip-link, menyu keyboard trap, icon-button `aria-label`lari va reduced-motion qo‘llab-quvvatlashi mavjud — saqlab qolinadi.

## 6. Tavsiya etilgan amalga oshirish tartibi

1. Mavjud palitrani saqlagan holda layout, radius, soya, transition va control balandlik tokenlarini kengaytirish.
2. `Select`, directory/deal yuzalari va loading holatlarini umumiylashtirish.
3. Filter, qidiruv, pagination va promocode CTA’larini tokenlardan foydalanishga o‘tkazish.
4. Directory hamda detail sahifalaridagi umumiy hero va card ritmini global utilitylar orqali birlashtirish.
5. Form xatosi fokusini, loading holati e’lonini va desktop/mobil ko‘rinishini tekshirish.
