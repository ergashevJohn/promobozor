"use client";

import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

type Props = {
  children: React.ReactNode;
};

const emptySubscribe = () => () => {};

export function MobileMenuToggle({ children }: Props) {
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const pathname = usePathname();
  const menuId = useId();
  const titleId = useId();
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

  const closeMenu = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };

  const menu =
    open && mounted
      ? createPortal(
          <>
            <button
              type="button"
              className="fixed inset-x-0 top-[4.75rem] bottom-0 z-[60] bg-black/40 backdrop-blur-[2px]"
              onClick={closeMenu}
              aria-label={tCommon("closeMenu")}
            />

            <div
              id={menuId}
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="border-border bg-card fixed inset-x-3 top-[calc(4.75rem+0.35rem)] z-[70] flex max-h-[min(30rem,calc(100dvh-5.75rem))] flex-col overflow-hidden rounded-[28px] border shadow-[0_28px_72px_-28px_rgba(17,24,39,0.55)]"
              style={{
                bottom: "max(0.75rem, env(safe-area-inset-bottom))",
              }}
            >
              {/* <div className="border-border flex items-center justify-between gap-3 border-b px-5 py-4">
                <p id={titleId} className="text-foreground text-sm font-semibold tracking-tight">
                  {tCommon("mobileNav")}
                </p>
                <button
                  type="button"
                  onClick={closeMenu}
                  className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex min-h-11 items-center justify-center rounded-xl px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  {tCommon("closeMenu")}
                </button>
              </div> */}

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
                {children}
              </div>

              <div className="border-border border-t p-4">
                <Button asChild size="lg" className="w-full">
                  <Link href="/promocodes" onClick={closeMenu}>
                    {tCommon("promocodes")}
                  </Link>
                </Button>
              </div>
            </div>
          </>,
          document.body
        )
      : null;

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
        aria-haspopup="dialog"
        className="relative z-[80] !size-11 min-h-11 min-w-11"
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

      {menu}
    </div>
  );
}
