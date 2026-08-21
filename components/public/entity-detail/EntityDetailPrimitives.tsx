import { Link } from "@/i18n/navigation";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";

type EntityHeroFrameProps = {
  children: ReactNode;
  variant: "store" | "category" | "brand";
};

export function EntityHeroFrame({ children, variant }: EntityHeroFrameProps) {
  return <section className={`entity-hero entity-hero--${variant}`}>{children}</section>;
}

export function EntityMetricRail({
  items,
}: {
  items: Array<{ label: string; value: number | string }>;
}) {
  return (
    <dl className="entity-metric-rail">
      {items.map((item) => (
        <div key={item.label} className="entity-metric">
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function EntityMetaRow({ children }: { children: ReactNode }) {
  return <div className="entity-meta-row">{children}</div>;
}

export function EntityAnchorNav({
  ariaLabel,
  items,
}: {
  ariaLabel: string;
  items: Array<{ href: string; label: string }>;
}) {
  return (
    <nav className="entity-anchor-nav" aria-label={ariaLabel}>
      {items.map((item) => (
        <a key={item.href} href={item.href} className="entity-anchor-link">
          {item.label}
        </a>
      ))}
    </nav>
  );
}

export function EntitySectionHeader({
  kicker,
  title,
  description,
}: {
  kicker?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6 max-w-2xl md:mb-8">
      {kicker ? <p className="brand-kicker mb-3">{kicker}</p> : null}
      <h2 className="brand-section-heading">{title}</h2>
      {description ? <p className="text-muted-foreground mt-3 leading-7">{description}</p> : null}
    </div>
  );
}

export function EntityConnectionPanel({
  title,
  description,
  emptyLabel,
  hrefPrefix,
  icon,
  links,
}: {
  title: string;
  description: string;
  emptyLabel: string;
  hrefPrefix: "/store/" | "/brand/" | "/category/";
  icon: ReactNode;
  links: Array<{ id: string; name: string; slug: string }>;
}) {
  return (
    <section className="entity-connection-panel" aria-label={title}>
      <div className="mb-5 flex items-start gap-3">
        <span className="entity-connection-icon" aria-hidden="true">
          {icon}
        </span>
        <div>
          <h3 className="text-foreground font-semibold">{title}</h3>
          <p className="text-muted-foreground mt-1 text-sm leading-6">{description}</p>
        </div>
      </div>
      {links.length > 0 ? (
        <ul className="divide-border border-border overflow-hidden rounded-xl border">
          {links.map((link) => (
            <li key={link.id}>
              <Link href={`${hrefPrefix}${link.slug}`} className="entity-connection-link">
                <span>{link.name}</span>
                <ArrowUpRightIcon className="size-4 shrink-0" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground border-border rounded-xl border border-dashed px-4 py-4 text-sm leading-6">
          {emptyLabel}
        </p>
      )}
    </section>
  );
}
