import { Link } from "@/i18n/navigation";
import {
  InstagramLogoIcon,
  TelegramLogoIcon,
  YoutubeLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

const socialLinks = [
  { name: "PromoBozor Telegram", href: "https://t.me/promokoduz_app", icon: TelegramLogoIcon },
  {
    name: "PromoBozor Instagram",
    href: "https://www.instagram.com/promokoduz_app",
    icon: InstagramLogoIcon,
  },
  {
    name: "PromoBozor YouTube",
    href: "https://www.youtube.com/@promokoduz_app",
    icon: YoutubeLogoIcon,
  },
] as const;

export async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "footer" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const currentYear = new Date().getFullYear();

  const mainLinks = [
    { href: "/" as const, label: tCommon("home") },
    { href: "/promocodes" as const, label: tCommon("promocodes") },
    { href: "/stores" as const, label: tCommon("stores") },
    { href: "/categories" as const, label: tCommon("categories") },
    { href: "/brands" as const, label: tCommon("brands") },
    { href: "/new" as const, label: t("newOffers") },
    { href: "/collections" as const, label: t("collections") },
    { href: "/blog" as const, label: t("blog") },
  ];

  const secondaryLinks = [
    { href: "/about" as const, label: t("about") },
    { href: "/how-we-verify-promocodes" as const, label: t("verification") },
    { href: "/faq" as const, label: "FAQ" },
    { href: "/contact" as const, label: t("contact") },
    { href: "/partners" as const, label: t("partners") },
    { href: "/privacy" as const, label: t("privacy") },
    { href: "/terms" as const, label: t("terms") },
  ];

  const linkClass =
    "text-muted-foreground hover:text-[color:var(--accent-red)] inline-flex min-h-9 items-center text-sm transition-colors";

  return (
    <footer className="border-border bg-card/80 mt-auto border-t">
      <div className="page-shell py-8 md:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.9fr_0.9fr]">
          <div>
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
              />
            </Link>
            <p className="text-muted-foreground mt-4 max-w-sm text-sm leading-7">
              {t("description")}
            </p>
            <p className="text-muted-foreground mt-3 max-w-sm text-xs leading-6">
              {t("socialNetworkNote")}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {socialLinks.map(({ name, href, icon: Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-border text-muted-foreground inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border px-3 transition-[color,background-color,border-color] hover:border-[color:var(--accent-red)]/40 hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-red)]"
                  aria-label={name}
                >
                  <Icon size={20} weight="regular" aria-hidden="true" />
                  <span className="sr-only">{name}</span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-foreground mb-3 text-sm font-semibold tracking-wide">
              {t("quickLinks")}
            </h2>
            <ul className="flex flex-col">
              {mainLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-foreground mb-3 text-sm font-semibold tracking-wide">
              {t("legal")}
            </h2>
            <ul className="flex flex-col">
              {secondaryLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-border text-muted-foreground mt-8 flex flex-wrap justify-between gap-2 border-t pt-6 text-sm">
          <p>
            © {currentYear} <span translate="no">PromoBozor</span>. {t("allRights")}.
          </p>
          <p className="mt-2">
            {t("createdBy")}{" "}
            <a
              href="https://t.me/jahongirergashev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground font-medium transition-colors hover:text-[color:var(--accent-red)]"
            >
              Jahongir Ergashev
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
