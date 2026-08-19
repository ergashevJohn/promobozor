import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { isValidLanguage } from "@/lib/i18n";
import {
  WarningCircleIcon,
  HouseIcon,
  MagnifyingGlassIcon,
  StorefrontIcon,
  TagIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

interface NotFoundProps {
  params?: Promise<{ locale: string }>;
}

async function resolveLocale(params?: Promise<{ locale: string }>) {
  if (params) {
    const { locale } = await params;
    if (isValidLanguage(locale)) {
      return locale;
    }
  }

  try {
    const locale = await getLocale();
    if (isValidLanguage(locale)) {
      return locale;
    }
  } catch {}

  return "uz";
}

export async function generateMetadata({ params }: NotFoundProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "notFound" });

  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
  };
}

export default async function NotFound({ params }: NotFoundProps) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "notFound" });
  const c = await getTranslations({ locale, namespace: "common" });

  const popularLinks = [
    {
      href: "/",
      label: c("home"),
      icon: HouseIcon,
      description: c("goHome"),
    },
    {
      href: "/stores",
      label: c("stores"),
      icon: StorefrontIcon,
      description: c("viewAllStores"),
    },
    {
      href: "/categories",
      label: c("categories"),
      icon: TagIcon,
      description: c("viewCategories"),
    },
    {
      href: "/brands",
      label: c("brands"),
      icon: TagIcon,
      description: c("viewBrands"),
    },
  ];

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-foreground text-9xl font-bold">404</h1>
        </div>

        {/* Error Icon and Message */}
        <div className="mb-6 flex justify-center">
          <div className="bg-muted rounded-full p-4">
            <WarningCircleIcon className="text-muted-foreground h-12 w-12" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-foreground mb-4 text-3xl font-bold md:text-4xl">{t("title")}</h2>

        {/* Description */}
        <p className="text-muted-foreground mb-8 text-lg">{t("description")}</p>

        {/* Primary Action Button */}
        <div className="mb-12">
          <Button asChild size="lg">
            <Link href="/">
              <HouseIcon className="mr-2 h-5 w-5" />
              {t("goHome")}
            </Link>
          </Button>
        </div>

        {/* Popular Pages Section */}
        <div className="border-border bg-card rounded-lg border p-6">
          <h3 className="text-foreground mb-4 text-xl font-semibold">{t("popularPages")}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {popularLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="bg-background hover:bg-accent border-border group flex items-center gap-3 rounded-lg border p-4 transition-colors"
                >
                  <div className="bg-primary/10 text-primary rounded-lg p-2">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-foreground font-medium">{link.label}</div>
                    <div className="text-muted-foreground text-sm">{link.description}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* MagnifyingGlass Suggestion */}
        <div className="mt-8">
          <p className="text-muted-foreground mb-4 text-sm">{t("orSearch")}</p>
          <Button asChild variant="outline">
            <Link href="/">
              <MagnifyingGlassIcon className="mr-2 h-4 w-4" />
              {c("search")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
