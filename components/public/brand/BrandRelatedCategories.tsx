import { EntityConnectionPanel } from "@/components/public/entity-detail/EntityDetailPrimitives";
import { TagIcon } from "@phosphor-icons/react/dist/ssr";

interface RelatedCategory {
  id: string;
  name: string;
  slug: string;
}

interface BrandRelatedCategoriesProps {
  relatedCategories: RelatedCategory[];
  t: (key: string) => string;
}

export default function BrandRelatedCategories({
  relatedCategories,
  t,
}: BrandRelatedCategoriesProps) {
  return (
    <EntityConnectionPanel
      title={t("relatedCategoriesKicker")}
      description={t("relatedCategoriesDescription")}
      emptyLabel={t("noLinkedCategories")}
      hrefPrefix="/category/"
      icon={<TagIcon className="size-5" weight="duotone" />}
      links={relatedCategories}
    />
  );
}
