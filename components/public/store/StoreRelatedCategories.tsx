import { EntityConnectionPanel } from "@/components/public/entity-detail/EntityDetailPrimitives";
import { TagIcon } from "@phosphor-icons/react/dist/ssr";

interface StoreRelatedCategoriesProps {
  relatedCategories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  translations: {
    title: string;
    relatedCategoriesDescription: string;
    noLinkedCategories: string;
  };
}

export default function StoreRelatedCategories({
  relatedCategories,
  translations,
}: StoreRelatedCategoriesProps) {
  return (
    <EntityConnectionPanel
      title={translations.title}
      description={translations.relatedCategoriesDescription}
      emptyLabel={translations.noLinkedCategories}
      hrefPrefix="/category/"
      icon={<TagIcon className="size-5" weight="duotone" />}
      links={relatedCategories}
    />
  );
}
