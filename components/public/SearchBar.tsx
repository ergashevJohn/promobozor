"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePathname, useRouter } from "@/i18n/navigation";
import { sanitizeSearchQuery } from "@/lib/search";
import { CircleNotch, MagnifyingGlass, X } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useCallback, useId, useMemo, useState } from "react";

const EMPTY_PARAMS: Record<string, string> = {};
type NavigationMode = "live" | "submit";

interface SearchBarProps {
  placeholder?: string;
  currentParams?: Record<string, string>;
  navigationMode?: NavigationMode;
  targetPath?: string;
}

export default function SearchBar({
  placeholder,
  currentParams = EMPTY_PARAMS,
  navigationMode = "live",
  targetPath,
}: SearchBarProps) {
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const destinationPath = targetPath || pathname;
  const uniqueId = useId();
  const searchInputId = `search-input-${uniqueId}`;

  const initialSearch = currentParams.search || "";
  const [searchValue, setSearchValue] = useState(initialSearch);
  const [isLoading, setIsLoading] = useState(false);

  const [prevSearch, setPrevSearch] = useState(initialSearch);
  if (prevSearch !== initialSearch) {
    setPrevSearch(initialSearch);
    setSearchValue(initialSearch);
  }

  const navigateWithSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams();

      Object.entries(currentParams).forEach(([key, paramValue]) => {
        if (paramValue !== undefined && paramValue !== "") {
          params.set(key, paramValue);
        }
      });

      const sanitized = sanitizeSearchQuery(value);
      if (sanitized) {
        params.set("search", sanitized);
      } else {
        params.delete("search");
      }

      const queryString = params.toString();
      router.push(queryString ? `${destinationPath}?${queryString}` : destinationPath);
    },
    [currentParams, destinationPath, router]
  );

  const debouncedSearchFn = useMemo(
    () =>
      debounce((value: string) => {
        navigateWithSearch(value);
        setIsLoading(false);
      }, 300),
    [navigateWithSearch]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    if (navigationMode === "live") {
      setIsLoading(true);
      debouncedSearchFn(value);
    }
  };

  const handleClear = () => {
    setSearchValue("");
    setIsLoading(false);
    if (navigationMode === "live") {
      navigateWithSearch("");
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (navigationMode !== "submit") {
      return;
    }
    navigateWithSearch(searchValue);
  };

  const placeholderText = placeholder || t("searchPlaceholder");

  return (
    <form className="relative w-full max-w-2xl" onSubmit={handleSubmit}>
      <Label htmlFor={searchInputId} className="sr-only">
        {placeholderText}
      </Label>
      <div
        className={`flex w-full gap-2 ${
          navigationMode === "submit" ? "flex-col sm:flex-row sm:items-center" : "items-center"
        }`}
      >
        <div className="relative flex-1">
          <MagnifyingGlass
            className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform"
            aria-hidden="true"
          />
          <Input
            id={searchInputId}
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder={placeholderText}
            aria-label={placeholderText}
            className={`h-12 rounded-2xl border-[color:var(--border)] bg-card/95 pl-10 text-base shadow-[0_24px_60px_-36px_rgba(17,24,39,0.55)] sm:h-14 ${
              navigationMode === "submit" ? "pr-12" : "pr-14"
            }`}
          />
          <div className="absolute top-1/2 right-1 flex -translate-y-1/2 transform items-center gap-1">
            {navigationMode === "live" && isLoading && (
              <CircleNotch className="text-muted-foreground h-4 w-4 animate-spin" />
            )}
            {searchValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                aria-label={t("clear")}
                className="h-11 w-11 min-h-11 min-w-11 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {navigationMode === "submit" && (
          <Button
            type="submit"
            className="h-12 w-full rounded-2xl px-5 sm:h-14 sm:w-auto"
            aria-label={t("search")}
          >
            {t("search")}
          </Button>
        )}
      </div>
    </form>
  );
}

function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
