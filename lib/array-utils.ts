/**
 * Counts unique values from an array using a single loop.
 * More efficient than array.map().filter(Boolean) which loops twice.
 *
 * @example
 * const uniqueStoreCount = countUnique(allPromocodes, (item) => item.store?.id);
 *
 * @param items - Array to process
 * @param selector - Function to extract a value from each item
 * @returns Number of unique non-empty values
 */
export function countUnique<T>(
  items: T[],
  selector: (item: T) => string | number | undefined | null
): number {
  const set = new Set<string | number>();
  for (const item of items) {
    const value = selector(item);
    if (value) {
      set.add(value);
    }
  }
  return set.size;
}
