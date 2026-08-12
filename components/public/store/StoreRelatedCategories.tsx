import { Link } from "@/i18n/navigation";

interface StoreRelatedCategoriesProps {
  relatedCategories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  translations: {
    relatedCategoriesDescription: string;
    noLinkedCategories: string;
  };
}

export default function StoreRelatedCategories({
  relatedCategories,
  translations,
}: StoreRelatedCategoriesProps) {
  return (
    <div className="surface-card p-5">
      <p className="text-muted-foreground mb-4 text-sm leading-6">
        {translations.relatedCategoriesDescription}
      </p>
      <div className="flex flex-wrap gap-3">
        {relatedCategories.length > 0 ? (
          relatedCategories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="rounded-full border border-[color:var(--border)] bg-[color:var(--secondary)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition-colors hover:border-[color:var(--accent-red)] hover:text-[color:var(--accent-red)]"
            >
              {category.name}
            </Link>
          ))
        ) : (
          <span className="text-sm text-[color:var(--muted-foreground)]">
            {translations.noLinkedCategories}
          </span>
        )}
      </div>
    </div>
  );
}
