import { MobileMenuToggle } from "@/components/public/headers/MobileMenuToggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

export async function Header() {
  const t = await getTranslations("common");

  const navLinks = [
    { href: "/promocodes" as const, label: t("promocodes") },
    { href: "/stores" as const, label: t("stores") },
    { href: "/categories" as const, label: t("categories") },
    { href: "/brands" as const, label: t("brands") },
    { href: "/contact" as const, label: t("contact") },
  ];

  return (
    <header className="bg-background/90 border-border sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex h-[4.5rem] items-center justify-between gap-4 py-3">
          <Link href="/" className="flex items-center">
            <Image
              src="/promobozor-logo.png"
              alt="PromoBozor - Chegirmalar va promokodlar bozori"
              width={260}
              height={64}
              sizes="(max-width: 768px) 180px, 260px"
              priority={true}
            />
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-white/80 bg-white/90 p-1 shadow-[0_18px_40px_-28px_rgba(17,24,39,0.45)] md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-[color:var(--accent)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 md:gap-4">
            <div className="hidden rounded-full border border-[color:var(--border)] bg-[color:var(--secondary)] px-3 py-2 text-xs font-semibold tracking-[0.12em] text-[color:var(--muted-foreground)] uppercase xl:block">
              PromoBozor
            </div>
            <LanguageSwitcher />
            <ThemeToggle />
            <MobileMenuToggle>
              <nav className="flex flex-col gap-2 md:hidden">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-foreground rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm font-medium shadow-[0_16px_36px_-28px_rgba(17,24,39,0.55)] transition-colors hover:bg-[color:var(--accent)]"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </MobileMenuToggle>
          </div>
        </div>
      </div>
    </header>
  );
}
