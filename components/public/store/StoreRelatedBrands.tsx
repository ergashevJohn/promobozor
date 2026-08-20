import { EntityConnectionPanel } from "@/components/public/entity-detail/EntityDetailPrimitives";
import { BuildingsIcon } from "@phosphor-icons/react/dist/ssr";

interface StoreRelatedBrandsProps {
  relatedBrands: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  translations: {
    title: string;
    relatedBrandsDescription: string;
    noLinkedBrands: string;
  };
}

export default function StoreRelatedBrands({
  relatedBrands,
  translations,
}: StoreRelatedBrandsProps) {
  return (
    <EntityConnectionPanel
      title={translations.title}
      description={translations.relatedBrandsDescription}
      emptyLabel={translations.noLinkedBrands}
      hrefPrefix="/brand/"
      icon={<BuildingsIcon className="size-5" weight="duotone" />}
      links={relatedBrands}
    />
  );
}
