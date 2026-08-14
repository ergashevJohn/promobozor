import { DesktopNavLinks } from "@/components/public/headers/DesktopNavLinks";
import { MobileMenuToggle } from "@/components/public/headers/MobileMenuToggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

export async function Header({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "common" });

  const navLinks = [
    { href: "/promocodes" as const, label: t("promocodes") },
    { href: "/stores" as const, label: t("stores") },
    { href: "/categories" as const, label: t("categories") },
    { href: "/brands" as const, label: t("brands") },
    { href: "/blog" as const, label: t("blog") },
    { href: "/contact" as const, label: t("contact") },
  ];

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="page-shell pointer-events-auto">
        <div className="border-border bg-card/90 flex items-center justify-between gap-2 rounded-full border px-3 py-2 shadow-[0_18px_50px_-28px_rgba(17,24,39,0.4)] backdrop-blur-xl sm:gap-3 sm:px-4 sm:py-2.5">
          <Link href="/" className="h-10">
            <Image
              src="/logo-white.png"
              alt="PromoBozor - chegirmalar va promokodlar"
              width={160}
              height={40}
              sizes="160px"
              className="hidden dark:block"
            />
            <Image
              src="/logo-black.png"
              alt="PromoBozor - chegirmalar va promokodlar"
              width={160}
              height={40}
              sizes="160px"
              className="block dark:hidden"
              // Only the default (light) logo competes for LCP bandwidth
              priority
            />
          </Link>

          <DesktopNavLinks links={navLinks} label={t("mainNav")} />

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <MobileMenuToggle links={navLinks} label={t("mobileNav")} />
          </div>
        </div>
      </div>
    </header>
  );
}
