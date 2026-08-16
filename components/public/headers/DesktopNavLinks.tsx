"use client";

import { Link, usePathname } from "@/i18n/navigation";

type NavLink = {
  href: "/promocodes" | "/stores" | "/categories" | "/brands" | "/blog" | "/contact";
  label: string;
};

/**
 * Lightweight client nav — only usePathname for aria-current.
 * (Avoid headers() here: it would force the user layout dynamic and break ISR.)
 */
export function DesktopNavLinks({ links, label }: { links: NavLink[]; label: string }) {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label={label}>
      {links.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={`focus-visible:ring-ring/50 inline-flex min-h-11 items-center rounded-lg px-3.5 py-2 text-sm font-medium transition-[color,background-color] duration-200 focus-visible:ring-[3px] focus-visible:outline-none ${
              isActive
                ? "bg-[color:var(--accent)] text-[color:var(--foreground)]"
                : "text-muted-foreground hover:text-foreground hover:bg-[color:var(--secondary)]"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
