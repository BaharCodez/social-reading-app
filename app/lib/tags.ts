import { prisma } from "@/app/lib/prisma";

/**
 * Every topic used across the writing room, most-used first. Drives the
 * editor's tag suggestions and the reading list's topic filter, so a tag
 * typed once can be picked again instead of retyped.
 */
export async function postTagCounts(): Promise<
  { tag: string; count: number }[]
> {
  const posts = await prisma.post.findMany({ select: { tags: true } });
  const counts = new Map<string, { tag: string; count: number }>();
  for (const post of posts) {
    for (const tag of post.tags) {
      const key = tag.toLowerCase();
      const seen = counts.get(key);
      if (seen) seen.count += 1;
      else counts.set(key, { tag, count: 1 });
    }
  }
  return [...counts.values()].sort(
    (a, b) => b.count - a.count || a.tag.localeCompare(b.tag),
  );
}
