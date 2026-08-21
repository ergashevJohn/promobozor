import type {
  StoreSearchIndexItem,
  StoresDirectoryItem,
} from "@/components/public/StoresDirectoryGrid";

/**
 * One-pass directory search: skip the intermediate array from filter().map().
 * Empty/whitespace queries return null so the page can keep the SSR grid.
 */
export function filterStoreSearchIndex(
  searchIndex: StoreSearchIndexItem[],
  rawQuery: string
): StoresDirectoryItem[] | null {
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    return null;
  }

  const matches: StoresDirectoryItem[] = [];
  for (const store of searchIndex) {
    if (!store?.searchText.includes(query)) {
      continue;
    }
    matches.push({
      id: store.id,
      name: store.name,
      slug: store.slug,
      logoUrl: store.logoUrl,
      promocodesCount: store.promocodesCount,
    });
  }
  return matches;
}
