import SafeHtmlContent from "./SafeHtmlContent";
import { getTranslations } from "next-intl/server";

interface BrandDescriptionProps {
  description: string | null | undefined;
  locale: string;
}

/**
 * Brand description component with HTML rendering
 * Server component - HTML sanitization happens server-side
 */
export default async function BrandDescription({ description, locale }: BrandDescriptionProps) {
  const tEmpty = await getTranslations({ locale, namespace: "empty" });

  return (
    <SafeHtmlContent
      html={description}
      className="content-prose-panel text-muted-foreground text-base leading-8 md:text-lg"
      fallback={
        <p className="content-prose-panel text-muted-foreground text-base md:text-lg">
          {tEmpty("noDescription")}
        </p>
      }
    />
  );
}
