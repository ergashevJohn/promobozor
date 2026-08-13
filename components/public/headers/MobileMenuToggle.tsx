"use client";

import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
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
  const [menuPathname, setMenuPathname] = useState(pathname);
  const menuId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Route o'zgarganda menyuni yopish (effect o'rniga render paytida)
  if (pathname !== menuPathname) {
    setMenuPathname(pathname);
    setOpen(false);
  }

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

  // Escape + body scroll lock
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
  }, [open]);

  // Portal: header dagi backdrop-blur fixed positioning ni buzadi
  const menu =
    mounted &&
    createPortal(
      <>
        <button
          type="button"
          aria-label={tCommon("closeMenu")}
          tabIndex={open ? 0 : -1}
          className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 md:hidden ${
            open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={closeMenu}
        />

        <div
          id={menuId}
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={tCommon("mobileNav")}
          hidden={!open}
          className={`border-border bg-card fixed inset-x-3 top-[calc(4.75rem+0.35rem)] z-40 flex max-h-[min(30rem,calc(100dvh-5.75rem))] flex-col overflow-hidden rounded-[28px] border p-0 shadow-[0_28px_72px_-28px_rgba(17,24,39,0.55)] transition-[opacity,transform] duration-200 md:hidden ${
            open
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-1 opacity-0"
          }`}
          style={{
            bottom: "max(0.75rem, env(safe-area-inset-bottom))",
          }}
        >
          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) {
                closeMenu();
              }
            }}
          >
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
    );

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
