import { EntityConnectionPanel } from "@/components/public/entity-detail/EntityDetailPrimitives";
import { StorefrontIcon } from "@phosphor-icons/react/dist/ssr";

interface RelatedStore {
  id: string;
  name: string;
  slug: string;
}

interface BrandRelatedStoresProps {
  relatedStores: RelatedStore[];
  t: (key: string) => string;
}

export default function BrandRelatedStores({ relatedStores, t }: BrandRelatedStoresProps) {
  return (
    <EntityConnectionPanel
      title={t("relatedStoresKicker")}
      description={t("relatedStoresDescription")}
      emptyLabel={t("noLinkedStores")}
      hrefPrefix="/store/"
      icon={<StorefrontIcon className="size-5" weight="duotone" />}
      links={relatedStores}
    />
  );
}
