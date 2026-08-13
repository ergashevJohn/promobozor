"use client";

import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close menu when the route changes (adjust state during render; no ref access here)
  if (pathname !== menuPathname) {
    setMenuPathname(pathname);
    if (open) {
      setOpen(false);
    }
  }

  const closeMenu = useCallback(() => {
    dialogRef.current?.close();
    setOpen(false);
  }, []);

  const openMenu = useCallback(() => {
    setOpen(true);
    // Use setTimeout to ensure dialog ref is set and open() can be called
    setTimeout(() => {
      dialogRef.current?.showModal();
    }, 0);
  }, []);

  // Keep native <dialog> in sync when open becomes false (route change, toggle, Escape)
  useEffect(() => {
    if (open) return;
    dialogRef.current?.close();
  }, [open]);

  // Body scroll lock (dialog.showModal handles focus trapping)
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Handle dialog close event (Escape key, backdrop click)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      setOpen(false);
      toggleRef.current?.focus();
    };

    dialog.addEventListener("close", handleClose);
    return () => {
      dialog.removeEventListener("close", handleClose);
    };
  }, []);

  // Set initial focus when dialog opens
  useEffect(() => {
    if (!open || !dialogRef.current) return;

    // Focus first focusable element after a brief delay to ensure dialog is rendered
    const timeoutId = setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [open]);

  // Portal: header dagi backdrop-blur fixed positioning ni buzadi
  const menu =
    mounted &&
    createPortal(
      <>
        {/* Backdrop - handles backdrop clicks */}
        <div
          role="presentation"
          className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 md:hidden ${
            open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={closeMenu}
          style={{ pointerEvents: open ? "auto" : "none" }}
        />

        <dialog
          ref={dialogRef}
          aria-label={tCommon("mobileNav")}
          className={`border-border bg-card fixed inset-x-3 top-[calc(4.75rem+0.35rem)] z-40 flex max-h-[min(30rem,calc(100dvh-5.75rem))] flex-col overflow-hidden rounded-[28px] border p-0 shadow-[0_28px_72px_-28px_rgba(17,24,39,0.55)] transition-[opacity,transform] duration-200 md:hidden ${
            open
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-1 opacity-0"
          }`}
          style={{
            bottom: "max(0.75rem, env(safe-area-inset-bottom))",
            margin: 0,
          }}
        >
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
        </dialog>
      </>,
      document.body
    );

  return (
    <div className="relative md:hidden">
      <Button
        ref={toggleRef}
        onClick={() => (open ? closeMenu() : openMenu())}
        variant="ghost"
        size="icon"
        aria-label={open ? tCommon("closeMenu") : tCommon("openMenu")}
        aria-expanded={open}
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
