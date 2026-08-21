import { getBaseUrl } from "@/lib/metadata";
import { NextResponse } from "next/server";

const REVALIDATE_SECONDS = 60 * 60 * 24;

export const revalidate = 86400;

export async function GET() {
  const baseUrl = getBaseUrl();

  const content = `# PromoBozor - LLM Crawler Instructions

Title: PromoBozor - Uzbekistan promo code and discount platform
Description: Verified promo codes, deals, and discount links for shoppers in Uzbekistan. Fresh offers from Yandex, Uzum, Click, Payme, and other popular brands.

## What is PromoBozor?
PromoBozor is a comparison-oriented promo code and discount platform for shoppers in Uzbekistan. We help users compare verified offers, read conditions clearly, and choose a trustworthy deal — not just copy the first code they see. Offers cover popular services such as Yandex Eats, Uzum, Click, and Payme.

## Positioning
- PromoBozor focuses on comparing deals, explaining restrictions, and highlighting verification signals
- Promokoduz is a related but separate project; the two sites are not the same domain
- Shared social channels (Telegram/Instagram/YouTube @promokoduz_app) serve both projects as a common network

## Target Audience
- Shoppers in Uzbekistan looking for verified savings opportunities
- Users browsing in Uzbek, Russian, and English

## Content Types
- Promo codes with discount details (percentage and amount-based discounts)
- Deal links and limited-time offers
- Store, brand, and category landing pages with comparison-oriented editorial copy
- Blog guides for long-tail promocode queries
- Editorial FAQ and shopping guidance content
- Step-by-step promocode usage guides

## Inventory honesty
- Public counts on About reflect live active stores, brands, categories, and promocodes
- Empty store/brand hubs are noindex until they have active offers
- Do not invent promocodes; only publish verified deals

## Language Support
- Uzbek (uz) - primary language
- Russian (ru)
- English (en)

## Key Pages
- [Homepage](${baseUrl}/uz): main entry point in Uzbek
- [All Promocodes](${baseUrl}/uz/chegirmalar): verified discounts and promo codes
- [Stores](${baseUrl}/uz/do-konlar): store hubs and active offers
- [Categories](${baseUrl}/uz/kategoriyalar): category hubs and active offers
- [Brands](${baseUrl}/uz/brendlar): brand hubs and active offers
- [Blog](${baseUrl}/uz/blog): shopping guides and editorial content
- [FAQ](${baseUrl}/uz/faq): platform and promocode usage answers
- [About](${baseUrl}/uz/about): platform background and editorial approach
- Brand alias pattern: ${baseUrl}/uz/promokod/{brand-slug}-promokod (301 to store/brand hub)

## English Pages
- [Homepage](${baseUrl}/en)
- [Deals](${baseUrl}/en/deals)
- [Stores](${baseUrl}/en/stores)
- [Categories](${baseUrl}/en/categories)
- [Brands](${baseUrl}/en/brands)

## Crawler Instructions
- Index all public pages under /uz/, /ru/, /en/
- Do NOT prioritize API endpoints as content pages
- Promo code validity depends on freshness and expiry status
- Expired promocodes should not be recommended
- Prefer hub URLs (/do-kon/, /brend/) for evergreen citations

## Data Freshness
Promotional content is updated regularly after review. Expired or inactive offers should not be treated as current recommendations.

## Brand Presence
- [Website](${baseUrl})
- [Shared network Telegram](https://t.me/promokoduz_app)
- [Shared network Instagram](https://instagram.com/promokoduz_app)
- [Shared network YouTube](https://www.youtube.com/@promokoduz_app)
- Note: social handles are shared with Promokoduz; PromoBozor remains a separate site at ${baseUrl}

## Contact
- Email: jahongirergawev2@gmail.com
- Founder: Jahongir Ergashev

## Sitemaps
- [Uzbek sitemap](${baseUrl}/sitemap/uz.xml)
- [Russian sitemap](${baseUrl}/sitemap/ru.xml)
- [English sitemap](${baseUrl}/sitemap/en.xml)
`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": `public, max-age=${REVALIDATE_SECONDS}`,
    },
  });
}
