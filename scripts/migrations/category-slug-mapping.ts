import type { Language } from "../../lib/i18n";

type SlugMap = Record<Language, string>;

type CategorySlugMappingItem = {
  id: string;
  slugs: SlugMap;
};

/**
 * Approved category slug mapping from user-reviewed preview.
 */
export const CATEGORY_SLUG_MAPPING: CategorySlugMappingItem[] = [
  {
    id: "2bc180c3-81de-4b6c-a064-a2637ba505c1",
    slugs: {
      uz: "sayohat-va-turizm",
      ru: "puteshestviya-i-turizm",
      en: "travel",
    },
  },
  {
    id: "495c92fa-03f4-442c-ad37-833a5b1e41d3",
    slugs: {
      uz: "kiyim-va-moda",
      ru: "odezhda-i-moda",
      en: "fashion",
    },
  },
  {
    id: "5b422c21-a55d-42b7-b325-94f4dae274df",
    slugs: {
      uz: "dasturlash-va-it-xizmatlari",
      ru: "programmirovanie-i-it-uslugi",
      en: "programming-it-services",
    },
  },
  {
    id: "933a9fa4-4ed3-411a-8fb0-891ad64f3236",
    slugs: {
      uz: "kripto-va-web3",
      ru: "kripto-i-web3",
      en: "crypto-web3",
    },
  },
  {
    id: "ae02f877-0295-49ad-9b15-542834593cf1",
    slugs: {
      uz: "oziq-ovqat-va-yetkazib-berish",
      ru: "eda-i-dostavka",
      en: "food-delivery",
    },
  },
  {
    id: "d5671b3c-6d30-4a4d-9461-02e59e536756",
    slugs: {
      uz: "gozallik-va-parvarish",
      ru: "krasota-i-uhod",
      en: "beauty-care",
    },
  },
  {
    id: "d6ab8e4d-a5ae-4f1a-9442-dc913811f33f",
    slugs: {
      uz: "elektronika",
      ru: "elektronika",
      en: "electronics",
    },
  },
  {
    id: "f5de4fbb-f6f6-4a9b-8f72-87641c1260d5",
    slugs: {
      uz: "fitness-va-sport",
      ru: "fitnes-i-sport",
      en: "fitness-sport",
    },
  },
  {
    id: "f9789d0e-e4fb-4e84-8ff7-60c454abebc9",
    slugs: {
      uz: "moliya-va-bank-xizmatlari",
      ru: "finansy-i-bankovskie-uslugi",
      en: "finance-banking",
    },
  },
];
