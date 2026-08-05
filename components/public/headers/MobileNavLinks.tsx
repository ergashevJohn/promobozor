"use client";

import { Link, usePathname } from "@/i18n/navigation";

type NavLink = {
  href: "/promocodes" | "/stores" | "/categories" | "/brands" | "/contact";
  label: string;
};

export function MobileNavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2 md:hidden" aria-label="Mobile">
      {links.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-[color:var(--accent-red)]/40 bg-[color:var(--accent)] text-[color:var(--accent-red)]"
                : "text-foreground border-border bg-card hover:bg-[color:var(--accent)]"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
