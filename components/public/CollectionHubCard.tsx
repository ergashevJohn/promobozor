import { Link } from "@/i18n/navigation";
import type { CollectionKey } from "@/lib/collections";
import {
  ArrowRightIcon,
  ArrowsClockwiseIcon,
  TruckIcon,
  UserPlusIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { ComponentType } from "react";

const COLLECTION_ICONS: Record<CollectionKey, ComponentType<{ className?: string }>> = {
  "first-order": UserPlusIcon,
  "repeat-order": ArrowsClockwiseIcon,
  delivery: TruckIcon,
};

export function CollectionHubCard({
  href,
  title,
  description,
  countLabel,
  browseLabel,
  collectionKey,
  heading: Heading = "h2",
}: {
  href: string;
  title: string;
  description: string;
  countLabel: string;
  browseLabel: string;
  collectionKey: CollectionKey;
  heading?: "h2" | "h3";
}) {
  const Icon = COLLECTION_ICONS[collectionKey];

  return (
    <Link href={href} className="directory-card group flex h-full flex-col p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)] text-[color:var(--accent-red)]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="text-muted-foreground text-sm font-medium">{countLabel}</span>
      </div>
      <Heading className="text-foreground text-xl font-semibold tracking-tight">{title}</Heading>
      <p className="text-muted-foreground mt-2 flex-1 text-sm leading-6">{description}</p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--accent-red)]">
        {browseLabel}
        <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
