import { GrouponCardActions } from "./GrouponCardActions";
import { PromocodeCardVisual } from "./PromocodeCardVisual";
import { getCardInactiveState, type PromocodeCardTranslations } from "./promocode-card-helpers";
import type { Promocode } from "./types";

interface GrouponCardProps {
  promocode: Promocode;
  priority?: boolean;
  translations: PromocodeCardTranslations;
}

export default function GrouponCard({
  promocode,
  priority = false,
  translations: t,
}: GrouponCardProps) {
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
          translations={t}
          disabled={isInactive}
        />
      }
    />
  );
}
