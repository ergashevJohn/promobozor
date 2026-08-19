import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";

type Props = {
  formAction: string;
  defaultValue?: string;
};

/**
 * Zero-JS hero search: GET form that posts to the promocodes list.
 * Avoids client SearchBar hydration on the LCP path (and CLS from deferred swap).
 */
export default async function HeroSearchForm({ formAction, defaultValue }: Props) {
  const t = await getTranslations("common");
  const placeholder = t("searchPlaceholder");
  const searchLabel = t("search");
  const inputId = "hero-search";

  return (
    <form action={formAction} method="get" className="relative mx-auto w-full max-w-2xl">
      <Label htmlFor={inputId} className="sr-only">
        {placeholder}
      </Label>
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon
            className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform"
            aria-hidden="true"
          />
          <Input
            id={inputId}
            type="search"
            name="search"
            defaultValue={defaultValue}
            placeholder={`${placeholder}…`}
            autoComplete="off"
            aria-label={placeholder}
            className="bg-card/95 h-12 rounded-2xl border-[color:var(--border)] pr-12 pl-10 text-base shadow-[0_24px_60px_-36px_rgba(15,20,25,0.28)] sm:h-14"
          />
        </div>
        <Button
          type="submit"
          className="h-12 w-full rounded-2xl px-5 sm:h-14 sm:w-auto"
          aria-label={searchLabel}
        >
          {searchLabel}
        </Button>
      </div>
    </form>
  );
}
