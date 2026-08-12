import { Link } from "@/i18n/navigation";

interface StoreRelatedBrandsProps {
  relatedBrands: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  translations: {
    relatedBrandsDescription: string;
    noLinkedBrands: string;
  };
}

export default function StoreRelatedBrands({
  relatedBrands,
  translations,
}: StoreRelatedBrandsProps) {
  return (
    <div className="surface-card p-5">
      <p className="text-muted-foreground mb-4 text-sm leading-6">
        {translations.relatedBrandsDescription}
      </p>
      <div className="flex flex-wrap gap-3">
        {relatedBrands.length > 0 ? (
          relatedBrands.map((brand) => (
            <Link
              key={brand.id}
              href={`/brand/${brand.slug}`}
              className="rounded-full border border-[color:var(--border)] bg-[color:var(--secondary)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition-colors hover:border-[color:var(--accent-red)] hover:text-[color:var(--accent-red)]"
            >
              {brand.name}
            </Link>
          ))
        ) : (
          <span className="text-sm text-[color:var(--muted-foreground)]">
            {translations.noLinkedBrands}
          </span>
        )}
      </div>
    </div>
  );
}
