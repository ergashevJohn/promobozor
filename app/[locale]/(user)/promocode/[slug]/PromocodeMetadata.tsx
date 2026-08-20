import { BreadcrumbsSchema } from "@/components/public/BreadcrumbsSchema";
import StructuredData from "@/components/public/StructuredData";
import type { TransformedPromocode } from "./transformers";

type PromocodeMetadataProps = {
  promocode: TransformedPromocode;
  promocodeTranslation: {
    title: string | null;
  } | null;
  storeTranslation: {
    name: string | null;
  } | null;
  breadcrumbItems: Array<{ name: string; url: string }>;
  locale: string;
  baseUrl: string;
  createdAt: string | undefined;
  updatedAt: string | undefined;
  tPromocode: { title: string };
  tStore: { title: string };
};

export function PromocodeMetadata({
  promocode,
  breadcrumbItems,
  locale,
  baseUrl,
  createdAt,
  updatedAt,
}: PromocodeMetadataProps) {
  return (
    <>
      <BreadcrumbsSchema items={breadcrumbItems} locale={locale} />
      <StructuredData
        type="Promocode"
        data={promocode}
        lang={locale}
        baseUrl={baseUrl}
        datePublished={createdAt}
        dateModified={updatedAt}
      />
    </>
  );
}
