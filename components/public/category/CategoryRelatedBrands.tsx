import { Link } from "@/i18n/navigation";

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
    <div className="surface-card p-5">
      <p className="text-muted-foreground mb-4 text-sm leading-6">
        {t("relatedBrandsDescription")}
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
            {t("noLinkedBrands")}
          </span>
        )}
      </div>
    </div>
  );
}
