"use client";

import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Stable close handler with focus restoration
  const closeMenu = useCallback(() => {
    if (dialogRef.current?.open) {
      dialogRef.current.close();
    }
    toggleRef.current?.focus();
  }, []);

  // Close dialog when pathname changes
  useEffect(() => {
    if (!open) return;

    const id = setTimeout(() => {
      closeMenu();
      setOpen(false);
    }, 0);
    return () => clearTimeout(id);
  }, [pathname, open, closeMenu]);

  // Handle dialog open/close and event listeners
  useEffect(() => {
    if (!open) {
      // Close dialog if it's still open
      if (dialogRef.current?.open) {
        dialogRef.current.close();
      }
      return;
    }

    // Open the dialog using showModal()
    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }

    // Capture refs for cleanup to ensure we always use the correct elements
    const dialog = dialogRef.current;
    const toggle = toggleRef.current;

    // Listen for dialog close events (Escape key, backdrop click)
    const handleDialogClose = () => {
      setOpen(false);
      toggle?.focus();
    };

    dialog?.addEventListener("close", handleDialogClose);
    dialog?.addEventListener("cancel", handleDialogClose);

    return () => {
      dialog?.removeEventListener("close", handleDialogClose);
      dialog?.removeEventListener("cancel", handleDialogClose);
      // Clean up by closing dialog
      if (dialog?.open) {
        dialog.close();
      }
    };
  }, [open]);

  const menu = mounted ? (
    <>
      <dialog
        id={menuId}
        ref={dialogRef}
        aria-label={tCommon("mobileNav")}
        className="border-border bg-card fixed inset-x-3 top-[calc(4.75rem+0.35rem)] z-[70] flex max-h-[min(30rem,calc(100dvh-5.75rem))] flex-col overflow-hidden rounded-[28px] border p-0 shadow-[0_28px_72px_-28px_rgba(17,24,39,0.55)] backdrop:bg-black/40 backdrop:backdrop-blur-[2px] open:flex"
        style={{
          bottom: "max(0.75rem, env(safe-area-inset-bottom))",
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
    </>
  ) : null;

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
