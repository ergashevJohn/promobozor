"use client";

import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

export function ThemeToggle() {
  const tCommon = useTranslations("common");
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label={tCommon("toggleTheme")}
        className="!size-11 min-h-11 min-w-11"
      >
        <SunIcon className="h-5 w-5" weight="light" aria-hidden="true" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={tCommon("toggleTheme")}
      className="!size-11 min-h-11 min-w-11"
    >
      {isDark ? (
        <MoonIcon className="h-5 w-5" weight="light" aria-hidden="true" />
      ) : (
        <SunIcon className="h-5 w-5" weight="light" aria-hidden="true" />
      )}
    </Button>
  );
}
