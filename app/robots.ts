import { getBaseUrl } from "@/lib/metadata";
import { MetadataRoute } from "next";

const LOCALES = ["uz", "ru", "en"] as const;
const COMMON_DISALLOW = ["/api/"];

// AI Search Crawlers - Allow these for GEO (Generative Engine Optimization)
const AI_SEARCH_CRAWLERS = [
  "GPTBot", // OpenAI ChatGPT
  "OAI-SearchBot", // OpenAI Search features
  "ChatGPT-User", // ChatGPT browsing
  "ClaudeBot", // Anthropic Claude
  "Claude-Web", // Anthropic Claude web
  "PerplexityBot", // Perplexity AI search
  "Google-Extended", // Google AI training
  "Amazonbot", // Amazon AI
  "Applebot-Extended", // Apple Intelligence training
  "FacebookBot", // Meta AI
  "LinkedInBot", // LinkedIn AI
  "Twitterbot", // X/Twitter AI
] as const;

// Training/Data Collection Crawlers - Block these to prevent unauthorized training
const TRAINING_CRAWLERS = [
  "CCot", // Common Crawl (training data)
  "anthropic-ai", // Anthropic training (not search)
  "Bytespider", // ByteDance TikTok training
] as const;

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      // AI Search Crawlers - Allow with admin restrictions
      ...AI_SEARCH_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: ["/"],
        disallow: COMMON_DISALLOW,
      })),
      // Training/Data Collection Crawlers - Block entirely
      ...TRAINING_CRAWLERS.map((userAgent) => ({
        userAgent,
        disallow: ["/"],
      })),
      // All other crawlers
      {
        userAgent: "*",
        allow: ["/"],
        disallow: COMMON_DISALLOW,
      },
      // Google Image bot for OG images
      {
        userAgent: "Googlebot-Image",
        allow: ["/api/og"],
      },
    ],
    // app/sitemap.ts generateSitemaps() -> /sitemap/uz.xml, /sitemap/ru.xml, /sitemap/en.xml
    sitemap: LOCALES.map((locale) => `${baseUrl}/sitemap/${locale}.xml`),
  };
}
