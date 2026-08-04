"use client";

import { Button } from "@/components/ui/button";
import { usePathname } from "@/i18n/navigation";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";

type Props = {
  children: React.ReactNode;
};

export function MobileMenuToggle({ children }: Props) {
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Auto-collapse when route changes (link bosilganda)
  useEffect(() => {
    const id = setTimeout(() => setOpen(false), 0);
    return () => clearTimeout(id);
  }, [pathname]);

  // Auto-collapse on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="relative md:hidden">
      <Button
        onClick={() => setOpen((v) => !v)}
        variant="ghost"
        size="icon"
        aria-label={open ? tCommon("closeMenu") : tCommon("openMenu")}
        aria-expanded={open}
        {...(open && { "aria-controls": "mobile-menu" })}
        className="h-9 w-9"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {/* Mobile menu overlay - only rendered when open to prevent aria-hidden issues */}
      {open && (
        <>
          <div
            id="mobile-menu"
            className="bg-background fixed inset-0 top-16 z-40 opacity-100"
            role="menu"
          >
            <div className="container mx-auto px-4 py-6">{children}</div>
          </div>

          {/* Overlay backdrop */}
          <div
            className="fixed inset-0 top-16 z-30 bg-black/20 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        </>
      )}
    </div>
  );
}
