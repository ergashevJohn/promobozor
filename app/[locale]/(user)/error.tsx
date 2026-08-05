"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Warning, House, ArrowsClockwise } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="bg-background flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="bg-destructive/10 rounded-full p-4">
            <Warning className="text-destructive h-12 w-12" />
          </div>
        </div>

        <h2 className="text-foreground mb-4 text-2xl font-bold">{t("title")}</h2>

        <p className="text-muted-foreground mb-8">{t("description")}</p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset} variant="default">
            <ArrowsClockwise className="mr-2 h-4 w-4" />
            {t("tryAgain")}
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <House className="mr-2 h-4 w-4" />
              {t("goHome")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
