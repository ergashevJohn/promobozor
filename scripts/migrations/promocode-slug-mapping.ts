import type { Language } from "../../lib/i18n";

type SlugMap = Record<Language, string>;

type PromocodeSlugMappingItem = {
  id: string;
  slugs: SlugMap;
};

/**
 * Approved mapping from the planning session.
 * Do not edit manually without product confirmation.
 */
export const PROMOCODE_SLUG_MAPPING: PromocodeSlugMappingItem[] = [
  {
    id: "819a7ac4-9f91-4eb5-8d06-052eab1564dd",
    slugs: {
      uz: "salom30-30-000-som-chegirma-birinchi-buyurtma-uchun",
      ru: "salom30-skidka-30-000-sum-na-pervyy-zakaz",
      en: "salom30-30000-uzs-discount-on-first-order",
    },
  },
  {
    id: "6f0d516e-6a51-4e77-b29f-cf9b8ad61159",
    slugs: {
      uz: "dodo-pizza-30-chegirma-birinchi-buyurtma",
      ru: "dodo-pitstsa-30-skidka-na-pervyy-zakaz",
      en: "dodo-pizza-30-discount-on-first-order",
    },
  },
  {
    id: "2a3ea563-153e-48fa-83cc-05ea826928a2",
    slugs: {
      uz: "uklon-70-gacha-chegirma-birinchi-safar-uchun",
      ru: "uklon-skidka-do-70-na-pervuyu-poezdku",
      en: "uklon-up-to-70-off-first-ride",
    },
  },
  {
    id: "96f78db2-0a13-4e2f-90cf-76a3bc184239",
    slugs: {
      uz: "1fit-7-kun-bepul-trial",
      ru: "1fit-7-dney-besplatnyy-trial",
      en: "1fit-7-days-free-trial",
    },
  },
  {
    id: "24e86629-6345-4683-964e-28d7b4e6563f",
    slugs: {
      uz: "alifnasiya-40-000-som-chegirma",
      ru: "alifnasiya-skidka-40-000-sum",
      en: "alifnasiya-40000-uzs-discount",
    },
  },
  {
    id: "660a7304-e89f-4345-bbc7-e889eb27bf55",
    slugs: {
      uz: "hevy-mashgulot-tracking-ilovasi",
      ru: "hevy-prilozhenie-dlya-otslezhivaniya-trenirovok",
      en: "hevy-workout-tracker-app",
    },
  },
  {
    id: "40e2b266-5363-4270-aec5-0898c9d143ab",
    slugs: {
      uz: "donga-azo-boling-referral-bonus",
      ru: "prisoedinyaytes-k-don-referalnyy-bonus",
      en: "join-don-referral-bonus",
    },
  },
  {
    id: "a60f7cf2-d3ac-4385-b75f-1d12a21a72c4",
    slugs: {
      uz: "uzum-bank-tavsiya-promokodi-jkota04tco",
      ru: "promokod-uzum-bank-jkota04tco",
      en: "uzum-bank-referral-code-jkota04tco",
    },
  },
  {
    id: "a7ccc8e7-e5ef-42ee-929c-5e725b65e754",
    slugs: {
      uz: "opal-promokod-pzw4f-30-kun-opal-pro",
      ru: "promokod-opal-pzw4f-30-dney-opal-pro",
      en: "opal-promo-code-pzw4f-30-day-opal-pro-pass",
    },
  },
  {
    id: "76321585-ff4f-48a1-bc7e-9d8500274b1a",
    slugs: {
      uz: "ibrat-akademy-promokod-5ny2yz",
      ru: "promokod-ibrat-akademy-5ny2yz",
      en: "ibrat-akademy-promo-code-5ny2yz",
    },
  },
  {
    id: "e9ce0912-ddfc-4303-b83e-d9038724c7d0",
    slugs: {
      uz: "jett-promokod-jettpromouz",
      ru: "promokod-jett-jettpromouz",
      en: "jett-promo-code-jettpromouz",
    },
  },
  {
    id: "a88a13e5-20bc-4fe8-9d84-2f469a035c3d",
    slugs: {
      uz: "domo-promokod-m6nkvp-kommunal-tolovlar-ilovasi",
      ru: "promokod-domo-m6nkvp-oplata-kommunalnyh-uslug",
      en: "domo-promo-code-m6nkvp-utility-payments-app",
    },
  },
  {
    id: "3b95dbec-f001-4575-a02d-ede7cf1a7067",
    slugs: {
      uz: "jet-promokod-qeuykh-2-ta-skuter-safari-uchun-50-chegirma",
      ru: "promokod-jet-qeuykh-50-na-2-poezdki-na-samokate",
      en: "jet-promo-code-qeuykh-50-off-2-scooter-rides",
    },
  },
  {
    id: "9e317922-1dd3-4b30-9e0b-778435e5a948",
    slugs: {
      uz: "v0-referal-oyiga-200-gacha-bepul-kredit-oling",
      ru: "v0-referal-poluchite-kredity-do-200mes",
      en: "v0-referral-get-up-to-200month-in-credits",
    },
  },
  {
    id: "eb22a347-079a-487c-a8a6-d9888fbf980d",
    slugs: {
      uz: "railway-boshlangich-kredit-va-oson-deployed",
      ru: "railway-startovyy-kredit-i-legkiy-deploy",
      en: "railway-starting-credit-easy-deployment",
    },
  },
  {
    id: "4f63850e-4497-4165-ae3e-d7caafa57516",
    slugs: {
      uz: "digitalocean-200-bepul-kredit-bonus",
      ru: "digitalocean-200-kredit-besplatno-bonus",
      en: "digitalocean-200-free-credit-bonus",
    },
  },
  {
    id: "f6d67a89-8142-4b3e-99e2-16d55831fd4a",
    slugs: {
      uz: "hostinger-20-chegirma-va-bepul-domen",
      ru: "hostinger-skidka-20-i-besplatnyy-domen",
      en: "hostinger-20-off-free-domain",
    },
  },
  {
    id: "3a8ebb7a-9f02-4261-90c4-816febfae29f",
    slugs: {
      uz: "osmon-card-oching-va-50-000-som-bonus-oling",
      ru: "otkroyte-osmon-card-i-poluchite-50-000-sumov",
      en: "get-50000-uzs-bonus-with-osmon-card",
    },
  },
  {
    id: "8f4e736b-5ec2-4676-a94a-01225c080208",
    slugs: {
      uz: "tbc-omonati-400-000-somgacha-bonus",
      ru: "bonus-do-400-000-sumov-na-vklady-tbc",
      en: "up-to-400000-uzs-bonus-for-tbc-deposits",
    },
  },
  {
    id: "c1bf64c1-55dc-40b6-9538-2f62f4a6e559",
    slugs: {
      uz: "salom-card-oching-va-30-000-som-bonus-oling",
      ru: "otkroyte-salom-card-i-poluchite-30-000-sumov",
      en: "get-30000-uzs-bonus-with-salom-card",
    },
  },
  {
    id: "64464d50-f8be-4cfe-9990-c962732b32a7",
    slugs: {
      uz: "mutolaa-premium-uchun-10-chegirma",
      ru: "skidka-10-na-mutolaa-premium",
      en: "10-discount-on-mutolaa-premium",
    },
  },
  {
    id: "ec820779-6c34-4efc-8a42-ddbec9746b65",
    slugs: {
      uz: "bepul-uzum-visa-va-30-chegirmalar",
      ru: "besplatnaya-karta-uzum-skidki-do-30",
      en: "free-uzum-card-up-to-30-discounts",
    },
  },
  {
    id: "e29071f6-8c0d-4d87-8e86-f0cd89794eaa",
    slugs: {
      uz: "iherb-birinchi-buyurtmada-20-gacha-chegirma",
      ru: "iherb-skidka-do-20-na-pervyy-zakaz",
      en: "iherb-up-to-20-off-first-order",
    },
  },
  {
    id: "dbc05965-2923-4d36-bd32-ce586bd7a1ef",
    slugs: {
      uz: "yandex-eats-40-000-som-chegirma-birinchi-buyurtma-uchun",
      ru: "yandeks-eda-skidka-40-000-sum-na-pervyy-zakaz",
      en: "yandex-eats-40000-uzs-discount-on-first-order",
    },
  },
  {
    id: "a91e6349-47ac-47a3-89e3-d618fde3d7e8",
    slugs: {
      uz: "yandex-market-30-000-som-chegirma-stmpcn0k",
      ru: "skidka-30-000-sum-v-yandeks-market-promokod-stmpcn0k",
      en: "30000-uzs-discount-at-yandex-market-promo-code-stmpcn0k",
    },
  },
  {
    id: "1cd8cdf9-b216-403d-8882-35c190cd4240",
    slugs: {
      uz: "glm-coding-plan-20-chegirma",
      ru: "glm-coding-plan-skidka-20",
      en: "glm-coding-plan-20-off",
    },
  },
];
