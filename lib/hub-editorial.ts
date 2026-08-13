export type HubLocale = "uz" | "ru" | "en";
export type HubKind = "store" | "brand";

export type HubEditorial = {
  /** Canonical slug used on /store/{slug} or /brand/{slug} */
  slug: string;
  kind: HubKind;
  name: Record<HubLocale, string>;
  description: Record<HubLocale, string>;
  aliases?: string[];
};

/**
 * Unique long-form hub copy for priority store/brand pages.
 * Prefer DB translations when present; use this as a quality fallback.
 */
export const HUB_EDITORIAL: HubEditorial[] = [
  {
    slug: "yandex-eats",
    kind: "brand",
    name: { uz: "Yandex Eats", ru: "Yandex Eats", en: "Yandex Eats" },
    aliases: ["yandex-go-eats", "yandeks-eats"],
    description: {
      uz: "Yandex Eats promokodlari birinchi buyurtma, minimal savat va yetkazib berish shartlariga bog‘liq bo‘lishi mumkin. PromoBozor’da faqat tekshirilgan takliflar chiqadi: kodni nusxalang, ilovada savatni to‘ldiring va to‘lovdan oldin promo maydonga qo‘ying. Har bir kartochkadagi muddat va shartlarni o‘qing — muddati o‘tgan kodlarni ishlatmang.",
      ru: "Промокоды Yandex Eats часто зависят от первого заказа, минимальной суммы и условий доставки. На PromoBozor публикуются проверенные предложения: скопируйте код, соберите корзину и вставьте промокод до оплаты. Всегда читайте срок и условия на карточке.",
      en: "Yandex Eats promocodes often depend on first-order rules, minimum basket size, and delivery conditions. On PromoBozor we list verified deals: copy the code, build your cart, and paste it before checkout. Always read the expiry and conditions on each card.",
    },
  },
  {
    slug: "yandex-go",
    kind: "brand",
    name: { uz: "Yandex Go", ru: "Yandex Go", en: "Yandex Go" },
    description: {
      uz: "Yandex Go (taksi va yetkazib berish) uchun promokodlar odatda yangi foydalanuvchi yoki ma’lum shahar/zona chekloviga ega. Kodni nusxalab, ilovada buyurtma berishdan oldin promo maydonga kiriting. Taklif shahar, transport turi va amal qilish muddatiga bog‘liq bo‘lishi mumkin.",
      ru: "Промокоды Yandex Go (такси и доставка) обычно ограничены новым пользователем или зоной. Скопируйте код и введите его в приложении до заказа. Условия зависят от города, типа поездки и срока действия.",
      en: "Yandex Go promocodes (rides and delivery) are often limited to new users or specific zones. Copy the code and enter it in the app before ordering. Conditions may depend on city, ride type, and expiry.",
    },
  },
  {
    slug: "uzum",
    kind: "store",
    name: { uz: "Uzum", ru: "Uzum", en: "Uzum" },
    aliases: ["uzum-market", "uzummarket"],
    description: {
      uz: "Uzum Market promokodlari checkout’da qo‘llanadi: savatni yig‘ing, promo maydonga kodni kiriting va chegirma qo‘llanayotganini tekshiring. Ba’zi kodlar kategoriya, birinchi xarid yoki minimal summaga bog‘liq. PromoBozor’da faqat jamoa tomonidan ko‘rib chiqilgan takliflar ko‘rsatiladi.",
      ru: "Промокоды Uzum Market применяются на checkout: соберите корзину, введите код и убедитесь, что скидка применилась. Часть кодов зависит от категории, первой покупки или минимальной суммы. На PromoBozor — только проверенные предложения.",
      en: "Uzum Market promocodes apply at checkout: build your cart, enter the code, and confirm the discount applied. Some codes are category-, first-purchase-, or minimum-order-specific. PromoBozor only lists reviewed offers.",
    },
  },
  {
    slug: "uzum-market",
    kind: "brand",
    name: { uz: "Uzum Market", ru: "Uzum Market", en: "Uzum Market" },
    description: {
      uz: "Uzum Market brend hubida marketpleys bo‘yicha tekshirilgan chegirmalar jamlangan. Kodni nusxalang, Uzum ilovasida yoki saytda savatni to‘ldiring va to‘lovdan oldin promo maydonga qo‘ying. Shartlar mahsulot kategoriyasi va aksiyaga qarab o‘zgarishi mumkin.",
      ru: "В хабе Uzum Market собраны проверенные скидки маркетплейса. Скопируйте код, соберите корзину в приложении или на сайте и вставьте промокод до оплаты. Условия могут зависеть от категории товара и акции.",
      en: "This Uzum Market hub collects verified marketplace discounts. Copy the code, build your cart in the app or site, and paste it before payment. Conditions can vary by product category and campaign.",
    },
  },
  {
    slug: "click",
    kind: "brand",
    name: { uz: "Click", ru: "Click", en: "Click" },
    description: {
      uz: "Click promokodlari odatda to‘lovlar, cashback yoki ilova ichidagi xizmatlarga tegishli. Kodni nusxalang va Click ilovasidagi tegishli bo‘limda faollashtiring. Har bir taklifning muddati va foydalanish limiti kartochkada ko‘rsatiladi.",
      ru: "Промокоды Click обычно относятся к платежам, кэшбэку или сервисам внутри приложения. Скопируйте код и активируйте его в нужном разделе Click. Срок и лимиты указаны на карточке.",
      en: "Click promocodes usually cover payments, cashback, or in-app services. Copy the code and activate it in the relevant Click section. Expiry and usage limits are shown on each card.",
    },
  },
  {
    slug: "payme",
    kind: "brand",
    name: { uz: "Payme", ru: "Payme", en: "Payme" },
    description: {
      uz: "Payme chegirma va bonuslari to‘lov, o‘tkazma yoki hamkor aksiyalariga bog‘liq bo‘lishi mumkin. Taklifni oching, shartlarni o‘qing va ilovada ko‘rsatilgan tartibda faollashtiring. Muddati o‘tgan yoki shartlarga mos kelmaydigan kodlar ishlamasligi mumkin.",
      ru: "Скидки и бонусы Payme могут относиться к платежам, переводам или партнёрским акциям. Откройте предложение, прочитайте условия и активируйте в приложении. Истёкшие или неподходящие по условиям коды могут не сработать.",
      en: "Payme discounts and bonuses may apply to payments, transfers, or partner campaigns. Open the offer, read the rules, and activate it in the app. Expired or mismatched codes may fail.",
    },
  },
  {
    slug: "express24",
    kind: "brand",
    name: { uz: "Express24", ru: "Express24", en: "Express24" },
    description: {
      uz: "Express24 yetkazib berish promokodlari odatda birinchi buyurtma yoki minimal summaga bog‘liq. Kodni nusxalang, savatni to‘ldiring va checkout’da qo‘llang. Restoran yoki do‘kon cheklovlari kartochkada yozilgan bo‘lishi mumkin.",
      ru: "Промокоды доставки Express24 часто зависят от первого заказа или минимальной суммы. Скопируйте код, соберите корзину и примените на checkout. Ограничения по ресторану или магазину могут быть указаны на карточке.",
      en: "Express24 delivery promocodes often require a first order or minimum spend. Copy the code, fill your cart, and apply it at checkout. Restaurant or store limits may be listed on the card.",
    },
  },
  {
    slug: "wolt",
    kind: "brand",
    name: { uz: "Wolt", ru: "Wolt", en: "Wolt" },
    description: {
      uz: "Wolt promokodlari yetkazib berish yoki birinchi buyurtma chegirmasiga tegishli bo‘lishi mumkin. Kodni ilovada savat sahifasida kiriting. Shahar, restoran va amal qilish muddati shartlarga kirishi mumkin.",
      ru: "Промокоды Wolt могут давать скидку на доставку или первый заказ. Введите код на экране корзины в приложении. Город, ресторан и срок действия могут входить в условия.",
      en: "Wolt promocodes may discount delivery or a first order. Enter the code on the cart screen in the app. City, restaurant, and expiry can be part of the rules.",
    },
  },
  {
    slug: "texnomart",
    kind: "store",
    name: { uz: "Texnomart", ru: "Texnomart", en: "Texnomart" },
    description: {
      uz: "Texnomart elektronika va maishiy texnika uchun promokodlar checkout yoki aksiya sahifasida qo‘llanadi. Ba’zi kodlar ma’lum kategoriya yoki brendga cheklangan. Taklifni nusxalang va to‘lovdan oldin chegirma qo‘llanayotganini tekshiring.",
      ru: "Промокоды Texnomart на электронику и технику применяются на checkout или на странице акции. Часть кодов ограничена категорией или брендом. Скопируйте предложение и проверьте скидку до оплаты.",
      en: "Texnomart electronics promocodes apply at checkout or on campaign pages. Some codes are limited to a category or brand. Copy the offer and confirm the discount before paying.",
    },
  },
  {
    slug: "mediapark",
    kind: "store",
    name: { uz: "MediaPark", ru: "MediaPark", en: "MediaPark" },
    description: {
      uz: "MediaPark takliflari odatda gadjetlar va aksessuarlar bo‘yicha chegirma beradi. Kodni savatda kiriting yoki aksiya havolasidan foydalaning. Minimal summa va kategoriya cheklovlarini kartochkadan tekshiring.",
      ru: "Предложения MediaPark обычно дают скидку на гаджеты и аксессуары. Введите код в корзине или перейдите по акционной ссылке. Проверьте минимальную сумму и ограничения категории на карточке.",
      en: "MediaPark deals usually discount gadgets and accessories. Enter the code in the cart or follow the campaign link. Check minimum spend and category limits on the card.",
    },
  },
  {
    slug: "olcha",
    kind: "store",
    name: { uz: "Olcha", ru: "Olcha", en: "Olcha" },
    description: {
      uz: "Olcha.uz promokodlari onlayn xaridlarda checkout’da qo‘llanadi. Kodni nusxalang, mahsulotni savatga qo‘shing va to‘lovdan oldin promo maydonga kiriting. Aksiya faqat tanlangan tovarlarga amal qilishi mumkin.",
      ru: "Промокоды Olcha.uz применяются при онлайн-покупке на checkout. Скопируйте код, добавьте товар в корзину и введите промокод до оплаты. Акция может действовать только на выбранные товары.",
      en: "Olcha.uz promocodes apply at online checkout. Copy the code, add items to your cart, and enter the promo field before payment. Some campaigns only cover selected products.",
    },
  },
  {
    slug: "asaxiy",
    kind: "store",
    name: { uz: "Asaxiy", ru: "Asaxiy", en: "Asaxiy" },
    description: {
      uz: "Asaxiy Books va texnika bo‘yicha chegirmalar ko‘pincha aksiya kodlari orqali beriladi. Kodni nusxalang va saytda to‘lovdan oldin qo‘llang. Kitob, texnika yoki yetkazib berish bo‘yicha alohida shartlar bo‘lishi mumkin.",
      ru: "Скидки Asaxiy Books и техники часто даются через промокоды. Скопируйте код и примените на сайте до оплаты. Могут быть отдельные условия для книг, техники или доставки.",
      en: "Asaxiy Books and tech discounts often come as promo codes. Copy the code and apply it on the site before payment. Books, tech, or delivery may have separate rules.",
    },
  },
  {
    slug: "aviasales",
    kind: "brand",
    name: { uz: "Aviasales", ru: "Aviasales", en: "Aviasales" },
    description: {
      uz: "Aviasales promokodlari aviachipta yoki mehmonxona bronlariga chegirma berishi mumkin. Kodni bron qilishdan oldin tegishli maydonga kiriting. Marshrut, sana va hamkor aviakompaniya cheklovlarini tekshiring.",
      ru: "Промокоды Aviasales могут давать скидку на авиабилеты или отели. Введите код в нужное поле до бронирования. Проверьте ограничения по маршруту, датам и авиакомпании.",
      en: "Aviasales promocodes may discount flights or hotels. Enter the code in the relevant field before booking. Check route, date, and airline partner limits.",
    },
  },
  {
    slug: "beeline",
    kind: "brand",
    name: { uz: "Beeline", ru: "Beeline", en: "Beeline" },
    aliases: ["beeline-uz"],
    description: {
      uz: "Beeline O‘zbekiston aksiyalari tarif, internet-paket yoki qurilma chegirmasiga tegishli bo‘lishi mumkin. Taklif shartlarini o‘qing va ilova yoki ofis orqali faollashtirish tartibini bajaring.",
      ru: "Акции Beeline Узбекистан могут касаться тарифа, интернет-пакета или скидки на устройство. Прочитайте условия и активируйте предложение в приложении или офисе.",
      en: "Beeline Uzbekistan campaigns may cover plans, data packs, or device discounts. Read the conditions and activate via the app or an office as instructed.",
    },
  },
  {
    slug: "ucell",
    kind: "brand",
    name: { uz: "Ucell", ru: "Ucell", en: "Ucell" },
    description: {
      uz: "Ucell promokod va bonuslari odatda yangi ulanish, paket yoki maxsus aksiya uchun beriladi. Kodni nusxalang va Ucell ko‘rsatmalariga muvofiq faollashtiring. Amal qilish muddati va abonent turi muhim.",
      ru: "Промокоды и бонусы Ucell обычно даются на новое подключение, пакет или спецакцию. Скопируйте код и активируйте по инструкции Ucell. Важны срок действия и тип абонента.",
      en: "Ucell promocodes and bonuses usually cover new connections, packs, or special campaigns. Copy the code and activate per Ucell instructions. Expiry and subscriber type matter.",
    },
  },
  {
    slug: "humans",
    kind: "brand",
    name: { uz: "Humans", ru: "Humans", en: "Humans" },
    description: {
      uz: "Humans mobil aloqa aksiyalari paketlar va yangi mijozlar uchun bonuslarga yo‘naltirilgan. Taklifni oching, shartlarni o‘qing va ilovada faollashtiring. Ba’zi kodlar faqat bir marta ishlaydi.",
      ru: "Акции Humans ориентированы на пакеты и бонусы для новых клиентов. Откройте предложение, прочитайте условия и активируйте в приложении. Некоторые коды работают только один раз.",
      en: "Humans mobile campaigns focus on packs and new-customer bonuses. Open the offer, read the rules, and activate in the app. Some codes work only once.",
    },
  },
  {
    slug: "korzinka",
    kind: "store",
    name: { uz: "Korzinka", ru: "Korzinka", en: "Korzinka" },
    description: {
      uz: "Korzinka onlayn va oflayn xaridlar uchun aksiya kodlari bo‘lishi mumkin. Ilova yoki saytda savatni yig‘ing va promo maydonga kodni kiriting. Mahsulot guruhlari va minimal summa cheklovlariga e’tibor bering.",
      ru: "У Korzinka могут быть промокоды для онлайн и офлайн покупок. Соберите корзину в приложении или на сайте и введите код. Учитывайте группы товаров и минимальную сумму.",
      en: "Korzinka may offer promo codes for online and offline shopping. Build your cart in the app or site and enter the code. Watch product-group and minimum-spend limits.",
    },
  },
  {
    slug: "makro",
    kind: "store",
    name: { uz: "Makro", ru: "Makro", en: "Makro" },
    description: {
      uz: "Makro supermarket aksiyalari odatda ma’lum mahsulotlar yoki savat summasiga bog‘liq. Kod yoki aksiya shartlarini kartochkadan o‘qing va checkout’da qo‘llang.",
      ru: "Акции супермаркета Makro обычно зависят от товаров или суммы корзины. Прочитайте код или условия на карточке и примените на checkout.",
      en: "Makro supermarket campaigns usually depend on products or basket size. Read the code or conditions on the card and apply at checkout.",
    },
  },
  {
    slug: "wildberries",
    kind: "brand",
    name: { uz: "Wildberries", ru: "Wildberries", en: "Wildberries" },
    aliases: ["wb"],
    description: {
      uz: "Wildberries promokodlari tovar kategoriyasi, birinchi buyurtma yoki aksiya davriga bog‘liq bo‘lishi mumkin. Kodni savatda kiriting va chegirma qo‘llanayotganini tekshiring.",
      ru: "Промокоды Wildberries могут зависеть от категории, первого заказа или периода акции. Введите код в корзине и проверьте применение скидки.",
      en: "Wildberries promocodes may depend on category, first order, or campaign window. Enter the code in the cart and confirm the discount applied.",
    },
  },
  {
    slug: "aliexpress",
    kind: "brand",
    name: { uz: "AliExpress", ru: "AliExpress", en: "AliExpress" },
    description: {
      uz: "AliExpress kuponlari ko‘pincha mobil ilova, yangi foydalanuvchi yoki kategoriya chekloviga ega. Kodni to‘lovdan oldin qo‘llang va valyuta/yetkazib berish shartlarini tekshiring.",
      ru: "Купоны AliExpress часто ограничены приложением, новым пользователем или категорией. Примените код до оплаты и проверьте условия валюты и доставки.",
      en: "AliExpress coupons are often limited to the app, new users, or categories. Apply the code before payment and check currency and shipping rules.",
    },
  },
  {
    slug: "mytaxi",
    kind: "brand",
    name: { uz: "MyTaxi", ru: "MyTaxi", en: "MyTaxi" },
    aliases: ["my-taxi"],
    description: {
      uz: "MyTaxi (taksi) promokodlari odatda birinchi safar yoki ma’lum shahar uchun beriladi. Kodni ilovada buyurtmadan oldin kiriting.",
      ru: "Промокоды MyTaxi обычно даются на первую поездку или определённый город. Введите код в приложении до заказа.",
      en: "MyTaxi promocodes usually cover a first ride or a specific city. Enter the code in the app before requesting a ride.",
    },
  },
  {
    slug: "bolt",
    kind: "brand",
    name: { uz: "Bolt", ru: "Bolt", en: "Bolt" },
    description: {
      uz: "Bolt taksi va yetkazib berish kodlari yangi foydalanuvchi yoki zona chekloviga ega bo‘lishi mumkin. Kodni nusxalang va ilovada faollashtiring.",
      ru: "Коды Bolt на такси и доставку могут быть ограничены новым пользователем или зоной. Скопируйте код и активируйте в приложении.",
      en: "Bolt ride and delivery codes may be limited to new users or zones. Copy the code and activate it in the app.",
    },
  },
  {
    slug: "anorbank",
    kind: "brand",
    name: { uz: "Anor Bank", ru: "Anor Bank", en: "Anor Bank" },
    aliases: ["anor", "anor-bank"],
    description: {
      uz: "Anor Bank aksiyalari karta, cashback yoki hamkor to‘lovlarga tegishli bo‘lishi mumkin. Shartlarni o‘qing va ilova orqali faollashtirish tartibini bajaring.",
      ru: "Акции Anor Bank могут касаться карты, кэшбэка или партнёрских платежей. Прочитайте условия и активируйте через приложение.",
      en: "Anor Bank campaigns may cover cards, cashback, or partner payments. Read the conditions and activate via the app.",
    },
  },
  {
    slug: "ipakyuli",
    kind: "brand",
    name: { uz: "Ipak Yuli", ru: "Ipak Yuli", en: "Ipak Yuli" },
    aliases: ["ipak-yuli"],
    description: {
      uz: "Ipak Yuli bank aksiyalari odatda karta xizmatlari va hamkor chegirmalariga bog‘liq. Taklif muddati va mijoz turi muhim — kartochkadagi shartlarni o‘qing.",
      ru: "Акции банка Ipak Yuli обычно связаны с карточными сервисами и партнёрскими скидками. Важны срок и тип клиента — читайте условия на карточке.",
      en: "Ipak Yuli bank campaigns usually involve card services and partner discounts. Expiry and customer type matter — read the card conditions.",
    },
  },
  {
    slug: "uzcard",
    kind: "brand",
    name: { uz: "Uzcard", ru: "Uzcard", en: "Uzcard" },
    description: {
      uz: "Uzcard hamkor aksiyalari to‘lov va cashback formatida bo‘lishi mumkin. Kod yoki aksiya shartlarini tekshirib, ko‘rsatilgan kanalda faollashtiring.",
      ru: "Партнёрские акции Uzcard могут быть в формате платежей и кэшбэка. Проверьте код или условия и активируйте в указанном канале.",
      en: "Uzcard partner campaigns may appear as payments or cashback. Check the code or rules and activate in the listed channel.",
    },
  },
  {
    slug: "humo",
    kind: "brand",
    name: { uz: "Humo", ru: "Humo", en: "Humo" },
    description: {
      uz: "Humo karta aksiyalari to‘lovlar va hamkor do‘konlar bo‘yicha chegirma berishi mumkin. Shartlar va muddatni o‘qing, keyin ko‘rsatilgan tartibda foydalaning.",
      ru: "Акции карты Humo могут давать скидки на платежи и в партнёрских магазинах. Прочитайте условия и срок, затем используйте по инструкции.",
      en: "Humo card campaigns may discount payments and partner stores. Read the conditions and expiry, then follow the activation steps.",
    },
  },
  {
    slug: "macbro",
    kind: "store",
    name: { uz: "MacBro", ru: "MacBro", en: "MacBro" },
    description: {
      uz: "MacBro Apple va gadjetlar bo‘yicha aksiya kodlari checkout’da qo‘llanadi. Kategoriya va ombor cheklovlarini kartochkadan tekshiring.",
      ru: "Промокоды MacBro на Apple и гаджеты применяются на checkout. Проверьте ограничения категории и наличия на карточке.",
      en: "MacBro Apple and gadget promo codes apply at checkout. Check category and stock limits on the card.",
    },
  },
  {
    slug: "idea",
    kind: "store",
    name: { uz: "Idea", ru: "Idea", en: "Idea" },
    description: {
      uz: "Idea.uz texnika do‘koni aksiyalari ma’lum brend yoki mahsulot guruhiga cheklangan bo‘lishi mumkin. Kodni savatda qo‘llang va chegirma qo‘llanayotganini ko‘ring.",
      ru: "Акции Idea.uz могут быть ограничены брендом или группой товаров. Примените код в корзине и проверьте скидку.",
      en: "Idea.uz campaigns may be limited to a brand or product group. Apply the code in the cart and confirm the discount.",
    },
  },
  {
    slug: "chakana",
    kind: "store",
    name: { uz: "Chakana", ru: "Chakana", en: "Chakana" },
    description: {
      uz: "Chakana marketpleys promokodlari sotuvchi yoki kategoriya bo‘yicha cheklanishi mumkin. Kodni to‘lovdan oldin kiriting.",
      ru: "Промокоды маркетплейса Chakana могут быть ограничены продавцом или категорией. Введите код до оплаты.",
      en: "Chakana marketplace promocodes may be limited by seller or category. Enter the code before payment.",
    },
  },
  {
    slug: "booking",
    kind: "brand",
    name: { uz: "Booking.com", ru: "Booking.com", en: "Booking.com" },
    aliases: ["booking-com"],
    description: {
      uz: "Booking.com promokodlari mehmonxona broniga chegirma berishi mumkin. Kodni bron qilishdan oldin kiriting va sanalar/mamlakat cheklovlarini tekshiring.",
      ru: "Промокоды Booking.com могут давать скидку на отели. Введите код до бронирования и проверьте ограничения по датам и стране.",
      en: "Booking.com promocodes may discount hotel stays. Enter the code before booking and check date or country limits.",
    },
  },
  {
    slug: "glovo",
    kind: "brand",
    name: { uz: "Glovo", ru: "Glovo", en: "Glovo" },
    description: {
      uz: "Glovo yetkazib berish kodlari birinchi buyurtma yoki minimal summaga bog‘liq bo‘lishi mumkin. Ilovada savat sahifasida qo‘llang.",
      ru: "Коды доставки Glovo могут зависеть от первого заказа или минимальной суммы. Примените на экране корзины в приложении.",
      en: "Glovo delivery codes may require a first order or minimum spend. Apply them on the cart screen in the app.",
    },
  },
  {
    slug: "yandex-lavka",
    kind: "brand",
    name: { uz: "Yandex Lavka", ru: "Яндекс Лавка", en: "Yandex Lavka" },
    description: {
      uz: "Yandex Lavka promokodlari tez yetkazib berish buyurtmalariga chegirma beradi. Minimal summa va zona cheklovlarini o‘qing.",
      ru: "Промокоды Яндекс Лавки дают скидку на заказы быстрой доставки. Читайте минимальную сумму и зону.",
      en: "Yandex Lavka promocodes discount quick-commerce orders. Read minimum basket and zone limits.",
    },
  },
  {
    slug: "uzum-nasiya",
    kind: "brand",
    name: { uz: "Uzum Nasiya", ru: "Uzum Nasiya", en: "Uzum Nasiya" },
    description: {
      uz: "Uzum Nasiya aksiyalari muddatli to‘lov yoki birinchi shartnoma bonusiga tegishli bo‘lishi mumkin. Shartlarni diqqat bilan o‘qing.",
      ru: "Акции Uzum Nasiya могут касаться рассрочки или бонуса за первый договор. Внимательно читайте условия.",
      en: "Uzum Nasiya campaigns may cover installment terms or first-contract bonuses. Read the conditions carefully.",
    },
  },
  {
    slug: "click-pass",
    kind: "brand",
    name: { uz: "Click Pass", ru: "Click Pass", en: "Click Pass" },
    description: {
      uz: "Click Pass aksiyalari transport yoki to‘lov imtiyozlariga bog‘liq bo‘lishi mumkin. Faollashtirish tartibini kartochkadan bajaring.",
      ru: "Акции Click Pass могут относиться к транспорту или платёжным льготам. Следуйте инструкции на карточке.",
      en: "Click Pass campaigns may cover transport or payment perks. Follow the activation steps on the card.",
    },
  },
  {
    slug: "paynet",
    kind: "brand",
    name: { uz: "Paynet", ru: "Paynet", en: "Paynet" },
    description: {
      uz: "Paynet to‘lov aksiyalari komissiya chegirmasi yoki cashback ko‘rinishida bo‘lishi mumkin. Muddat va xizmat turini tekshiring.",
      ru: "Акции Paynet могут быть в виде скидки на комиссию или кэшбэка. Проверьте срок и тип услуги.",
      en: "Paynet payment campaigns may appear as fee discounts or cashback. Check expiry and service type.",
    },
  },
  {
    slug: "mygov",
    kind: "brand",
    name: { uz: "my.gov.uz", ru: "my.gov.uz", en: "my.gov.uz" },
    aliases: ["my-gov"],
    description: {
      uz: "Davlat xizmatlari bo‘yicha to‘g‘ridan-to‘g‘ri “promokod” kam uchraydi; bu yerda tegishli to‘lov/servis yo‘nalishlaridagi foydali takliflar jamlanadi.",
      ru: "Прямые «промокоды» для госуслуг редки; здесь собраны полезные предложения по смежным платежам и сервисам.",
      en: "Direct “promocodes” for government services are rare; this hub collects related payment and service savings where available.",
    },
  },
  {
    slug: "zoodmall",
    kind: "store",
    name: { uz: "ZoodMall", ru: "ZoodMall", en: "ZoodMall" },
    description: {
      uz: "ZoodMall marketpleys kuponlari kategoriya va aksiya oynasiga bog‘liq. Kodni savatda qo‘llang.",
      ru: "Купоны маркетплейса ZoodMall зависят от категории и окна акции. Примените код в корзине.",
      en: "ZoodMall marketplace coupons depend on category and campaign window. Apply the code in the cart.",
    },
  },
  {
    slug: "sulpak",
    kind: "store",
    name: { uz: "Sulpak", ru: "Sulpak", en: "Sulpak" },
    description: {
      uz: "Sulpak texnika aksiyalari brend yoki mahsulot guruhiga cheklangan bo‘lishi mumkin. Checkout’da kodni kiriting.",
      ru: "Акции Sulpak на технику могут быть ограничены брендом или группой товаров. Введите код на checkout.",
      en: "Sulpak tech campaigns may be limited to a brand or product group. Enter the code at checkout.",
    },
  },
  {
    slug: "mi-store",
    kind: "store",
    name: { uz: "Mi Store", ru: "Mi Store", en: "Mi Store" },
    aliases: ["xiaomi"],
    description: {
      uz: "Mi Store / Xiaomi aksiyalari gadjet va aksessuarlar uchun beriladi. Kod yoki aksiya havolasini to‘lovdan oldin qo‘llang.",
      ru: "Акции Mi Store / Xiaomi даются на гаджеты и аксессуары. Примените код или ссылку до оплаты.",
      en: "Mi Store / Xiaomi campaigns cover gadgets and accessories. Apply the code or deal link before payment.",
    },
  },
  {
    slug: "samsung",
    kind: "brand",
    name: { uz: "Samsung", ru: "Samsung", en: "Samsung" },
    description: {
      uz: "Samsung O‘zbekiston aksiyalari telefon, TV yoki maishiy texnika bo‘yicha bo‘lishi mumkin. Rasmiy shartlar va muddatni tekshiring.",
      ru: "Акции Samsung в Узбекистане могут касаться телефонов, ТВ или бытовой техники. Проверьте официальные условия и срок.",
      en: "Samsung Uzbekistan campaigns may cover phones, TVs, or appliances. Check official conditions and expiry.",
    },
  },
  {
    slug: "apple",
    kind: "brand",
    name: { uz: "Apple", ru: "Apple", en: "Apple" },
    description: {
      uz: "Apple mahsulotlari bo‘yicha chegirmalar ko‘pincha hamkor do‘konlar orqali beriladi. Tegishli do‘kon hubidagi kodlarni tekshiring.",
      ru: "Скидки на продукцию Apple чаще всего дают партнёрские магазины. Смотрите коды в хабах соответствующих магазинов.",
      en: "Apple product discounts are often offered via partner stores. Check codes on the matching store hubs.",
    },
  },
];

const bySlug = new Map<string, HubEditorial>();
for (const hub of HUB_EDITORIAL) {
  bySlug.set(hub.slug, hub);
  for (const alias of hub.aliases || []) {
    bySlug.set(alias, hub);
  }
}

export function getHubEditorial(
  slug: string,
  locale: string,
  kind?: HubKind
): { name: string; description: string; canonicalSlug: string; kind: HubKind } | null {
  const hub = bySlug.get(slug);
  if (!hub) return null;
  if (kind && hub.kind !== kind) {
    // Allow cross-kind reuse when the same brand operates as store slug
    // only if aliases intentionally map here; otherwise skip.
  }
  const lang = (["uz", "ru", "en"].includes(locale) ? locale : "uz") as HubLocale;
  return {
    name: hub.name[lang],
    description: hub.description[lang],
    canonicalSlug: hub.slug,
    kind: hub.kind,
  };
}

export function listHubEditorialTargets(): HubEditorial[] {
  return HUB_EDITORIAL;
}
