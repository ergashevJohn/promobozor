import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

export async function Footer() {
  const t = await getTranslations("footer");
  const tCommon = await getTranslations("common");
  const currentYear = new Date().getFullYear();

  const socialLinks = {
    telegram: "https://t.me/promokoduz_app",
    telegramBot: "https://t.me/promokoduz_app_bot",
    instagram: "https://www.instagram.com/promokoduz_app",
    youtube: "https://www.youtube.com/@promokoduz_app",
  } as const;

  return (
    <footer className="mt-auto border-t border-white/10 bg-[#111827] text-white">
      <div className="container mx-auto px-6 py-8 lg:px-8">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/promobozor-logo.png"
                alt="PromoBozor - Chegirmalar va promokodlar bozori"
                width={260}
                height={64}
                sizes="260px"
              />
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-6 text-slate-300">{t("description")}</p>
          </div>

          <div>
            <h2 className="mb-3 font-semibold text-white">{t("quickLinks")}</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-slate-300 transition-colors hover:text-[#ff5a4f]">
                  {tCommon("home")}
                </Link>
              </li>
              <li>
                <Link
                  href="/stores"
                  className="text-slate-300 transition-colors hover:text-[#ff5a4f]"
                >
                  {tCommon("stores")}
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="text-slate-300 transition-colors hover:text-[#ff5a4f]"
                >
                  {tCommon("categories")}
                </Link>
              </li>
              <li>
                <Link
                  href="/brands"
                  className="text-slate-300 transition-colors hover:text-[#ff5a4f]"
                >
                  {tCommon("brands")}
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-slate-300 transition-colors hover:text-[#ff5a4f]"
                >
                  {t("about")}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-slate-300 transition-colors hover:text-[#ff5a4f]">
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/how-we-verify-promocodes"
                  className="text-slate-300 transition-colors hover:text-[#ff5a4f]"
                >
                  {t("verification")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-3 font-semibold text-white">{t("legal")}</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/privacy"
                  className="text-slate-300 transition-colors hover:text-[#ff5a4f]"
                >
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-slate-300 transition-colors hover:text-[#ff5a4f]"
                >
                  {t("terms")}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-slate-300 transition-colors hover:text-[#ff5a4f]"
                >
                  {t("contact")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-3 font-semibold text-white">{t("followUs")}</h2>
            <div className="flex gap-4">
              <a
                href={socialLinks.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 transition-colors hover:text-[#ff5a4f]"
                aria-label="Telegram"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                </svg>
              </a>
              <a
                href={socialLinks.telegramBot}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 transition-colors hover:text-[#ff5a4f]"
                aria-label="Telegram"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                </svg>
              </a>
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 transition-colors hover:text-[#ff5a4f]"
                aria-label="Instagram"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href={socialLinks.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 transition-colors hover:text-[#ff5a4f]"
                aria-label="YouTube"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505a3.017 3.017 0 0 0-2.122 2.136C0 8.264 0 12 0 12s0 3.736.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.377.505 9.377.505s7.505 0 9.377-.505a3.016 3.016 0 0 0 2.122-2.136C24 15.736 24 12 24 12s0-3.736-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
            <p className="mt-3 text-sm text-slate-300">{t("socialDescription")}</p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 text-slate-300">
          <div className="space-y-2 text-center text-sm">
            <p>
              © {currentYear} PromoBozor. {t("allRights")}.
            </p>
            <p className="flex items-center justify-center gap-2">
              <span>{t("createdBy")}</span>
              <a
                href="https://t.me/jahongirergashev"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-white transition-colors hover:text-[#ff5a4f] hover:underline"
              >
                Jahongir Ergashev
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
