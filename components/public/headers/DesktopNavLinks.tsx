"use client";

import { Link, usePathname } from "@/i18n/navigation";

type NavLink = {
  href: "/promocodes" | "/stores" | "/categories" | "/brands" | "/contact";
  label: string;
};

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
            className={`inline-flex min-h-11 items-center rounded-lg px-3.5 py-2 text-sm font-medium transition-[color,background-color] duration-200 ${
              isActive
                ? "bg-[color:var(--accent)] text-[color:var(--accent-red)]"
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
