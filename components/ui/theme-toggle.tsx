"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

export function ThemeToggle() {
  const tCommon = useTranslations("common");
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const toggleTheme = () => {
    if (theme === "system") {
      const isDarkSystem = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(isDarkSystem ? "light" : "dark");
    } else {
      setTheme(theme === "dark" ? "light" : "dark");
    }
  };

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label={tCommon("toggleTheme")}
        className="!size-11 min-h-11 min-w-11"
      >
        <Sun className="h-5 w-5" weight="light" aria-hidden="true" />
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
        <Moon className="h-5 w-5" weight="light" aria-hidden="true" />
      ) : (
        <Sun className="h-5 w-5" weight="light" aria-hidden="true" />
      )}
    </Button>
  );
}
