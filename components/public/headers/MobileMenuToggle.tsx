"use client";

import { Button } from "@/components/ui/button";
import { usePathname } from "@/i18n/navigation";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
};

export function MobileMenuToggle({ children }: Props) {
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const id = setTimeout(() => setOpen(false), 0);
    return () => clearTimeout(id);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }

      if (e.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const firstLink = panelRef.current?.querySelector<HTMLElement>("a[href], button");
    firstLink?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="relative md:hidden">
      <Button
        ref={toggleRef}
        onClick={() => setOpen((v) => !v)}
        variant="ghost"
        size="icon"
        aria-label={open ? tCommon("closeMenu") : tCommon("openMenu")}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className="!size-11 min-h-11 min-w-11"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {open && (
        <>
          <div
            id={menuId}
            ref={panelRef}
            className="bg-background fixed inset-x-0 top-14 bottom-0 z-40 animate-in fade-in slide-in-from-top-2 duration-200 sm:top-[4.5rem]"
            role="menu"
          >
            <div className="container mx-auto px-4 py-6">{children}</div>
          </div>

          <div
            className="fixed inset-x-0 top-14 bottom-0 z-30 bg-black/20 backdrop-blur-sm sm:top-[4.5rem]"
            onClick={() => {
              setOpen(false);
              toggleRef.current?.focus();
            }}
            aria-hidden="true"
          />
        </>
      )}
    </div>
  );
}
