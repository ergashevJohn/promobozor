"use client";

import { GrouponCardActions } from "./GrouponCardActions";
import { PromocodeCardVisual } from "./PromocodeCardVisual";
import { getCardInactiveState, type PromocodeCardTranslations } from "./promocode-card-helpers";
import type { Promocode } from "./types";

interface GrouponCardOptimizedProps {
  promocode: Promocode;
  priority?: boolean;
  translations: PromocodeCardTranslations;
}

export default function GrouponCardOptimized({
  promocode,
  priority = false,
  translations: t,
}: GrouponCardOptimizedProps) {
  const translation = promocode.translations?.[0];
  const detailHref = {
    pathname: "/promocode/[slug]" as const,
    params: { slug: translation?.slug || promocode.id },
  };
  const { isInactive } = getCardInactiveState(promocode);

  return (
    <PromocodeCardVisual
      promocode={promocode}
      priority={priority}
      translations={t}
      detailHref={detailHref}
      actions={
        <GrouponCardActions
          promocodeId={promocode.id}
          type={promocode.type || "code"}
          code={promocode.code}
          link={promocode.link ?? null}
          storeUrl={promocode.store?.websiteUrl || promocode.brand?.websiteUrl || null}
          translations={t}
          disabled={isInactive}
        />
      }
    />
  );
}
