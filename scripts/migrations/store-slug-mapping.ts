import type { Language } from "../../lib/i18n";

type SlugMap = Record<Language, string>;

type StoreSlugMappingItem = {
  id: string;
  slugs: SlugMap;
};

/**
 * Approved store slug mapping from user-reviewed preview.
 */
export const STORE_SLUG_MAPPING: StoreSlugMappingItem[] = [
  {
    id: "2150f4be-b702-4083-bcf6-76a650fb6bef",
    slugs: {
      uz: "korzinka",
      ru: "korzinka",
      en: "korzinka",
    },
  },
  {
    id: "29ee7919-8fd4-4c85-b889-a50b08f8924a",
    slugs: {
      uz: "yandex-market",
      ru: "yandeks-market",
      en: "yandex-market",
    },
  },
  {
    id: "6871cfa3-1445-4a1d-8580-731ea6214b23",
    slugs: {
      uz: "iherb-rasmiy-dokoni",
      ru: "ofitsialnyy-magazin-iherb",
      en: "official-iherb-store",
    },
  },
  {
    id: "9c5a8757-fc4f-4a00-b9d6-b87ab6959de6",
    slugs: {
      uz: "uzum-market",
      ru: "uzum-market",
      en: "uzum-market",
    },
  },
  {
    id: "f0091021-9ce7-4259-bd46-a07ae77620a2",
    slugs: {
      uz: "don",
      ru: "don",
      en: "don",
    },
  },
];
