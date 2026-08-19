"use client";

import { Link, usePathname } from "@/i18n/navigation";
import type { Icon } from "@phosphor-icons/react";
import {
  ArrowRightIcon,
  ArticleIcon,
  BuildingsIcon,
  EnvelopeSimpleIcon,
  SquaresFourIcon,
  StorefrontIcon,
  TicketIcon,
} from "@phosphor-icons/react/dist/ssr";

type NavLink = {
  href: "/promocodes" | "/stores" | "/categories" | "/brands" | "/blog" | "/contact";
  label: string;
};

const NAV_ICONS: Record<NavLink["href"], Icon> = {
  "/promocodes": TicketIcon,
  "/stores": StorefrontIcon,
  "/categories": SquaresFourIcon,
  "/brands": BuildingsIcon,
  "/blog": ArticleIcon,
  "/contact": EnvelopeSimpleIcon,
};

export function MobileNavLinks({ links, label }: { links: NavLink[]; label: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1.5 md:hidden" aria-label={label}>
      {links.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
        const Icon = NAV_ICONS[link.href];

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={`group focus-visible:ring-ring/50 inline-flex min-h-14 items-center gap-3 rounded-2xl px-3.5 py-3 text-base font-medium transition-colors focus-visible:ring-[3px] focus-visible:outline-none ${
              isActive
                ? "text-foreground bg-[color:var(--accent)] ring-1 ring-[color:var(--accent-red)]/35"
                : "text-foreground hover:bg-[color:var(--accent)]/70"
            }`}
          >
            <span
              className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl ${
                isActive
                  ? "bg-[color:var(--accent-red)] text-white"
                  : "group-hover:text-foreground bg-[color:var(--secondary)] text-[color:var(--muted-foreground)]"
              }`}
            >
              <Icon size={20} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1 text-left">{link.label}</span>
            <ArrowRightIcon
              className={`size-4 shrink-0 transition-transform ${
                isActive
                  ? "text-[color:var(--accent-red)]"
                  : "text-muted-foreground opacity-60 group-hover:translate-x-0.5 group-hover:opacity-100"
              }`}
              aria-hidden="true"
            />
          </Link>
        );
      })}
    </nav>
  );
}
