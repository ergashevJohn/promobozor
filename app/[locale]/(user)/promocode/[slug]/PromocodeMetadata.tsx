import { BreadcrumbsSchema } from "@/components/public/BreadcrumbsSchema";
import { HowToSchema } from "@/components/public/HowToSchema";
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
  rating:
    | {
        ratingValue: number;
        reviewCount: number;
        bestRating: number;
        worstRating: number;
      }
    | undefined;
  createdAt: string | undefined;
  updatedAt: string | undefined;
  tPromocode: { title: string };
  tStore: { title: string };
};

export function PromocodeMetadata({
  promocode,
  promocodeTranslation,
  storeTranslation,
  breadcrumbItems,
  locale,
  baseUrl,
  rating,
  createdAt,
  updatedAt,
  tPromocode,
  tStore,
}: PromocodeMetadataProps) {
  return (
    <>
      <BreadcrumbsSchema items={breadcrumbItems} locale={locale} />
      <StructuredData
        type="Promocode"
        data={promocode}
        lang={locale}
        baseUrl={baseUrl}
        rating={rating}
        datePublished={createdAt}
        dateModified={updatedAt}
      />
      <HowToSchema
        promocodeTitle={promocodeTranslation?.title || tPromocode.title}
        storeName={storeTranslation?.name || tStore.title}
        locale={locale}
        imageUrl={promocode.imageUrl || promocode.store?.logoUrl || "/icon.png"}
        baseUrl={baseUrl}
      />
    </>
  );
}
