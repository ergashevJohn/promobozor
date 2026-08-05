import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: "./messages/uz.json",
  },
});

const nextConfig: NextConfig = {
  // Production source maps
  // Development da source maps avtomatik ishlaydi
  // Production da source maps o'chirilgan (security va performance uchun)
  // Chrome extension xatolari development da normal (React DevTools va boshqalar)
  productionBrowserSourceMaps: false,

  // Next.js 16: Partial Prerendering (PPR) - ma'lumotlarni stream qilish
  // ppr: "incremental" Next.js 16 da cacheComponents ga birlashtirilgan
  // cacheComponents yoqish uchun runtime/dynamic route config'larni olib tashlash kerak
  experimental: {
    // Optimize package imports for better tree shaking
    optimizePackageImports: ["@phosphor-icons/react", "sonner"],
    // Optimize CSS for smaller bundles
    optimizeCss: true,
    // Optimize server components
    optimizeServerReact: true,
  },

  images: {
    remotePatterns: [
      // Supabase storage
      ...(process.env.NODE_ENV === "production"
        ? ([{ protocol: "https" as const, hostname: "ik.imagekit.io" }] as const)
        : []),

      ...(process.env.NODE_ENV === "development"
        ? ([
            { protocol: "https" as const, hostname: "cdn.example.com" },
            { protocol: "https" as const, hostname: "ik.imagekit.io" },
          ] as const)
        : []),
    ],
    // Allow unoptimized images for external hosts during development
    unoptimized: false,
    // Image optimization - AVIF birinchi, keyin WebP
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600,
    // Device sizes - responsive images uchun
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Image sizes - Next.js generatsiya qiladigan o'lchamlar
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // CSS preload xatolarini kamaytirish
  // Bu warning Next.js da keng tarqalgan va performance ga katta ta'sir qilmaydi
  // onDemandEntries sozlamalari CSS preload warning ni kamaytiradi
  // maxInactiveAge musbat raqam bo'lishi kerak (millisekundlarda)
  onDemandEntries: {
    // Pages buffer length - kamaytirish CSS preload warning ni kamaytiradi
    pagesBufferLength: 1,
    // Max inactive age - tezroq cleanup (minimum 1 second)
    // Manfiy raqam bo'lmasligi uchun Math.max ishlatamiz
    maxInactiveAge: Math.max(15 * 1000, 1000), // Minimum 1 second
  },
  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          // Performance: Preconnect to external image CDN
          {
            key: "Link",
            value: "<https://ik.imagekit.io>; rel=preconnect; crossorigin=anonymous",
          },
          // Performance: DNS prefetch for external domains
          {
            key: "Link",
            value: "<https://ik.imagekit.io>; rel=dns-prefetch",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-site",
          },
          {
            key: "Origin-Agent-Cluster",
            value: "?1",
          },
        ],
      },
    ];
  },
  // Compression
  compress: true,
  // Note: swcMinify is enabled by default in Next.js 13+ and removed in Next.js 16
  // Server external packages (moved from experimental.serverComponentsExternalPackages in Next.js 16)
  serverExternalPackages: ["postgres"],

  // Webpack configuration for optimization
  webpack(config, { dev }) {
    // Optimize for smaller bundles in production
    if (!dev) {
      // Production-only optimizations
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: true,
      };
    }

    return config;
  },
};

export default withNextIntl(nextConfig);
