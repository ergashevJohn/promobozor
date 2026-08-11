import { Link } from "@/i18n/navigation";

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
    <div className="surface-card p-5">
      <p className="text-muted-foreground mb-4 text-sm leading-6">
        {t("relatedStoresDescription")}
      </p>
      <div className="flex flex-wrap gap-3">
        {relatedStores.length > 0 ? (
          relatedStores.map((store) => (
            <Link
              key={store.id}
              href={`/store/${store.slug}`}
              className="rounded-full border border-[color:var(--border)] bg-[color:var(--secondary)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition-colors hover:border-[color:var(--accent-red)] hover:text-[color:var(--accent-red)]"
            >
              {store.name}
            </Link>
          ))
        ) : (
          <span className="text-sm text-[color:var(--muted-foreground)]">
            {t("noLinkedStores")}
          </span>
        )}
      </div>
    </div>
  );
}
