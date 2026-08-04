/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      // Replace Cyrillic characters with Latin equivalents
      .replace(/[а-яё]/g, (char) => {
        const cyrillicMap: Record<string, string> = {
          а: "a",
          б: "b",
          в: "v",
          г: "g",
          д: "d",
          е: "e",
          ё: "e",
          ж: "zh",
          з: "z",
          и: "i",
          й: "y",
          к: "k",
          л: "l",
          м: "m",
          н: "n",
          о: "o",
          п: "p",
          р: "r",
          с: "s",
          т: "t",
          у: "u",
          ф: "f",
          х: "h",
          ц: "ts",
          ч: "ch",
          ш: "sh",
          щ: "shch",
          ъ: "",
          ы: "y",
          ь: "",
          э: "e",
          ю: "yu",
          я: "ya",
        };
        return cyrillicMap[char] || char;
      })
      // Replace Uzbek specific characters
      .replace(/[ўқғҳ]/g, (char) => {
        const uzbekMap: Record<string, string> = {
          ў: "o",
          қ: "q",
          ғ: "gh",
          ҳ: "h",
        };
        return uzbekMap[char] || char;
      })
      // Remove all non-alphanumeric characters except spaces and hyphens
      .replace(/[^a-z0-9\s-]/g, "")
      // Replace multiple spaces or hyphens with a single hyphen
      .replace(/[\s-]+/g, "-")
      // Remove leading and trailing hyphens
      .replace(/^-+|-+$/g, "")
      // Limit length to 100 characters
      .substring(0, 100)
      .replace(/-+$/, "")
  );
}
