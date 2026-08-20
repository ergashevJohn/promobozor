import { EntityConnectionPanel } from "@/components/public/entity-detail/EntityDetailPrimitives";
import { BuildingsIcon } from "@phosphor-icons/react/dist/ssr";

interface RelatedBrand {
  id: string;
  name: string;
  slug: string;
}

interface CategoryRelatedBrandsProps {
  relatedBrands: RelatedBrand[];
  t: (key: string) => string;
}

export default function CategoryRelatedBrands({ relatedBrands, t }: CategoryRelatedBrandsProps) {
  return (
    <EntityConnectionPanel
      title={t("relatedBrandsKicker")}
      description={t("relatedBrandsDescription")}
      emptyLabel={t("noLinkedBrands")}
      hrefPrefix="/brand/"
      icon={<BuildingsIcon className="size-5" weight="duotone" />}
      links={relatedBrands}
    />
  );
}
