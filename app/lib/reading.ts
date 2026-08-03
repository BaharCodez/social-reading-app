/**
 * Word count and estimated read time for a markdown post. Strips markup so
 * links, image syntax and formatting don't inflate the count; 200 wpm is the
 * usual estimate for prose.
 */
export function readingStats(md: string): { words: number; minutes: number } {
  const text = md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = text ? text.split(" ").length : 0;
  return { words, minutes: Math.max(1, Math.round(words / 200)) };
}
