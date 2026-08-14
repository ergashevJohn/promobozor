"use client";

import { Button } from "@/components/ui/button";
import { usePathname } from "@/i18n/navigation";
import { X } from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

type NavLink = {
  href: "/promocodes" | "/stores" | "/categories" | "/brands" | "/blog" | "/contact";
  label: string;
};

type Props = {
  links: NavLink[];
  label: string;
  children?: React.ReactNode;
};

const emptySubscribe = () => () => {};

const MobileNavLinksLazy = dynamic(
  () =>
    import("@/components/public/headers/MobileNavLinks").then((mod) => ({
      default: mod.MobileNavLinks,
    })),
  { ssr: false, loading: () => null }
);

export function MobileMenuToggle({ links, label, children }: Props) {
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close menu when the route changes (adjust state during render)
  if (pathname !== menuPathname) {
    setMenuPathname(pathname);
    if (open) {
      setOpen(false);
    }
  }

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

  const openMenu = useCallback(() => {
    setOpen(true);
  }, []);

  const handleDialogClose = useCallback(() => {
    setOpen(false);
    toggleRef.current?.focus();
  }, []);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Native dialog modal open/close
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }
      return;
    }

    if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Close menu when a nav link inside the panel is clicked
  useEffect(() => {
    if (!open || !panelRef.current) return;

    const panel = panelRef.current;
    const handleClick = (event: MouseEvent) => {
      if ((event.target as HTMLElement).closest("a")) {
        closeMenu();
      }
    };

    panel.addEventListener("click", handleClick);
    return () => panel.removeEventListener("click", handleClick);
  }, [open, closeMenu]);

  // Close menu when the native dialog backdrop is clicked
  useEffect(() => {
    if (!open || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const handleClick = (event: MouseEvent) => {
      const rect = dialog.getBoundingClientRect();
      const isBackdropClick =
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom;

      if (isBackdropClick) {
        closeMenu();
      }
    };

    dialog.addEventListener("click", handleClick);
    return () => dialog.removeEventListener("click", handleClick);
  }, [open, closeMenu]);

  // Focus first interactive control when panel opens
  useEffect(() => {
    if (!open || !panelRef.current) return;

    const timeoutId = setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [open]);

  // Portal: header backdrop-blur creates a stacking context that breaks fixed positioning
  const menu =
    mounted &&
    createPortal(
      <dialog
        ref={dialogRef}
        id={menuId}
        aria-label={tCommon("mobileNav")}
        onClose={handleDialogClose}
        className={`border-border bg-card fixed inset-x-3 top-[calc(4.75rem+0.35rem)] z-40 m-0 flex max-h-[min(30rem,calc(100dvh-5.75rem))] w-auto max-w-none flex-col overflow-hidden rounded-[28px] border p-0 shadow-[0_28px_72px_-28px_rgba(17,24,39,0.55)] transition-[opacity,transform] duration-200 md:hidden [&::backdrop]:bg-black/40 [&::backdrop]:backdrop-blur-[2px] ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        }`}
        style={{
          bottom: "max(0.75rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="border-border flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2.5">
          <p className="text-foreground truncate text-sm font-semibold">{tCommon("mobileNav")}</p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={tCommon("closeMenu")}
            onClick={closeMenu}
            className="!size-10 min-h-10 min-w-10 shrink-0"
          >
            <X size={20} aria-hidden="true" />
          </Button>
        </div>

        <div ref={panelRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
          {children ?? (open ? <MobileNavLinksLazy links={links} label={label} /> : null)}
        </div>
      </dialog>,
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
        aria-controls={menuId}
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
