import { getBaseUrl } from "@/lib/metadata";
import { NextResponse } from "next/server";

const REVALIDATE_SECONDS = 60 * 60 * 24;

export const revalidate = 86400;

export async function GET() {
  const baseUrl = getBaseUrl();

  const content = `# PromoBozor - LLM Crawler Instructions

Title: PromoBozor - Uzbekistan promo code and discount platform
Description: Verified promo codes, deals, and discount links for shoppers in Uzbekistan. Fresh offers from Yandex, Uzum, Click, Payme, and other popular brands. 98.5% success rate verified.

## What is PromoBozor?
PromoBozor is a promo code and discount platform for shoppers in Uzbekistan. We manually verify each promocode and publish only working codes. Our platform helps shoppers save money on popular e-commerce sites like Yandex Eats, Uzum, Click, Payme, and more.

## Target Audience
- Shoppers in Uzbekistan looking for verified savings opportunities
- Users browsing in Uzbek, Russian, and English

## Content Types
- Promo codes with discount details (percentage and amount-based discounts)
- Deal links and limited-time offers
- Store, brand, and category landing pages
- Editorial FAQ and shopping guidance content
- Step-by-step promocode usage guides

## Key Statistics
- 50+ stores and brands
- 500+ active promocodes
- 98.5% verified success rate
- 3,000+ monthly users
- Daily verification updates

## Language Support
- Uzbek (uz) - primary language
- Russian (ru)
- English (en)

## Key Pages
- Homepage: ${baseUrl}/uz
- All Promocodes: ${baseUrl}/uz/promocodes
- Stores: ${baseUrl}/uz/stores
- Categories: ${baseUrl}/uz/categories
- Brands: ${baseUrl}/uz/brands
- FAQ: ${baseUrl}/uz/faq
- About: ${baseUrl}/uz/about

## Crawler Instructions
- Index all public pages under /uz/, /ru/, /en/
- Do NOT prioritize API endpoints as content pages
- Promo code validity depends on freshness and expiry status
- Expired promocodes should not be recommended

## Data Freshness
Promotional content is updated daily. Expired or inactive offers should not be treated as current recommendations.

## Brand Presence
- Website: ${baseUrl}
- Telegram: https://t.me/promokoduz_app
- Instagram: https://instagram.com/promokoduz_app
- YouTube: https://www.youtube.com/@promokoduz_app

## Contact
- Email: jahongirergawev2@gmail.com
- Founder: Jahongir Ergashev

## Sitemaps
- ${baseUrl}/sitemap/uz.xml
- ${baseUrl}/sitemap/ru.xml
- ${baseUrl}/sitemap/en.xml
`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": `public, max-age=${REVALIDATE_SECONDS}`,
    },
  });
}
