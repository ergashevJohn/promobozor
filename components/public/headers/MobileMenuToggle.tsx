"use client";

import { Button } from "@/components/ui/button";
import { usePathname } from "@/i18n/navigation";
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
        className="!size-11 relative min-h-11 min-w-11"
      >
        <span className="relative flex size-5 items-center justify-center" aria-hidden="true">
          <span
            className={`bg-foreground absolute h-0.5 w-4 rounded-full transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              open ? "translate-y-0 rotate-45" : "-translate-y-1.5"
            }`}
          />
          <span
            className={`bg-foreground absolute h-0.5 w-4 rounded-full transition-opacity duration-200 ${
              open ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`bg-foreground absolute h-0.5 w-4 rounded-full transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              open ? "translate-y-0 -rotate-45" : "translate-y-1.5"
            }`}
          />
        </span>
      </Button>

      {open && (
        <>
          <div
            id={menuId}
            ref={panelRef}
            className="bg-background/95 fixed inset-x-0 top-[4.5rem] bottom-0 z-40 overscroll-contain backdrop-blur-xl sm:top-[5rem]"
            role="navigation"
            aria-label="Main"
          >
            <div className="page-shell py-8">
              <div className="stagger-reveal flex flex-col gap-2">{children}</div>
            </div>
          </div>

          <div
            className="fixed inset-x-0 top-[4.5rem] bottom-0 z-30 bg-black/25 sm:top-[5rem]"
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
