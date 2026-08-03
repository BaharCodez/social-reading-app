import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/app/lib/prisma";
import RoomShell from "@/app/components/RoomShell";
import { readingStats } from "@/app/lib/reading";

export const metadata: Metadata = {
  title: "writing room — bahar's house",
  description: "Notes on what I'm reading and what I'm building.",
};

/* The first embedded image, used as the card's cover. */
function firstImage(md: string): string | null {
  const m = md.match(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/);
  return m ? m[1] : null;
}

function stamp(date: Date) {
  return date
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();
}

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  // Render per request — entries change, and CI builds have no database.
  await connection();
  const { tag } = await searchParams;
  const active = tag?.trim().toLowerCase() || null;

  const posts = await prisma.post.findMany({
    orderBy: [{ publishedAt: { sort: "desc", nulls: "first" } }],
    select: {
      id: true,
      title: true,
      content: true,
      tags: true,
      publishedAt: true,
    },
  });

  // Topic index across every entry, most-used first — the reuse menu.
  const counts = new Map<string, { tag: string; count: number }>();
  for (const post of posts) {
    for (const t of post.tags) {
      const key = t.toLowerCase();
      const seen = counts.get(key);
      if (seen) seen.count += 1;
      else counts.set(key, { tag: t, count: 1 });
    }
  }
  const topics = [...counts.values()].sort(
    (a, b) => b.count - a.count || a.tag.localeCompare(b.tag),
  );
  const activeLabel = active ? (counts.get(active)?.tag ?? active) : null;

  const shown = active
    ? posts.filter((p) => p.tags.some((t) => t.toLowerCase() === active))
    : posts;

  return (
    <RoomShell
      title="writing room"
      heading="The Writing Room"
      image={{
        src: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=1200&h=400&fit=crop&auto=format",
        alt: "An open notebook and pen on a desk",
      }}
    >
      <div className="mx-auto w-full max-w-5xl px-4 pt-8 pb-16 sm:px-6">
        {/* intro + actions, aligned with the grid below */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-ink-soft text-base leading-relaxed">
            notes, learning &amp; essays
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/notes/board"
              className="border-line text-ink hover:bg-accent/10 rotate-2 rounded-sm border bg-surface px-3 py-2 text-xs font-medium shadow-[3px_4px_0_rgba(42,31,14,0.1)] transition-all hover:rotate-0"
            >
              📌 the hobby board
            </Link>
            <Link
              href="/notes/write"
              className="bg-accent text-accent-ink font-pixel rounded-full px-4 py-1.5 text-xs hover:opacity-90"
            >
              ✎ write something
            </Link>
          </div>
        </div>

        {/* topics filter — reuse a tag by clicking it */}
        {topics.length > 0 && (
          <div className="border-line mb-8 flex flex-wrap items-center gap-2 border-y py-3">
            <span className="text-ink-soft/60 mr-1 font-mono text-xs tracking-[0.2em] uppercase">
              topics
            </span>
            <Link
              href="/notes"
              className={`rounded-full px-3 py-1 font-mono text-xs transition-colors ${
                active
                  ? "text-ink-soft hover:text-ink"
                  : "bg-accent text-accent-ink"
              }`}
            >
              all
            </Link>
            {topics.map((t) => {
              const on = t.tag.toLowerCase() === active;
              return (
                <Link
                  key={t.tag}
                  href={`/notes?tag=${encodeURIComponent(t.tag)}`}
                  className={`rounded-full px-3 py-1 font-mono text-xs transition-colors ${
                    on
                      ? "bg-accent text-accent-ink"
                      : "bg-accent/10 text-ink hover:bg-accent/20"
                  }`}
                >
                  {t.tag}
                  <span className="opacity-50"> · {t.count}</span>
                </Link>
              );
            })}
          </div>
        )}

        {activeLabel && (
          <p className="text-ink-soft mb-6 text-sm">
            Showing{" "}
            <span className="text-ink font-semibold">{shown.length}</span> entr
            {shown.length === 1 ? "y" : "ies"} tagged{" "}
            <span className="text-ink font-semibold">{activeLabel}</span>.
          </p>
        )}

        {/* entries grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-9 lg:grid-cols-3 lg:gap-x-8">
          {shown.map((post) => {
            const cover = firstImage(post.content);
            const { minutes } = readingStats(post.content);
            const href = post.publishedAt
              ? `/notes/${post.id}`
              : `/notes/write?id=${post.id}`;
            return (
              <article key={post.id} className="group flex flex-col">
                <Link href={href} className="block">
                  {cover ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={cover}
                      alt=""
                      loading="lazy"
                      className="border-line aspect-[3/2] w-full rounded-md border object-cover"
                    />
                  ) : (
                    <div className="border-line bg-accent/8 flex aspect-[3/2] w-full items-center justify-center rounded-md border">
                      <span className="text-accent/30 font-serif text-4xl italic">
                        {post.title.trim().charAt(0).toUpperCase() || "✎"}
                      </span>
                    </div>
                  )}
                </Link>

                <div className="text-ink-soft/70 mt-2.5 flex items-center gap-2 font-mono text-[0.65rem] tracking-wider">
                  <span className="text-accent-2">
                    {post.publishedAt ? stamp(post.publishedAt) : "DRAFT"}
                  </span>
                  <span aria-hidden>·</span>
                  <span>{minutes} min</span>
                </div>

                <h3 className="text-ink mt-1 font-serif text-base leading-snug font-bold">
                  <Link
                    href={href}
                    className="group-hover:text-accent underline-offset-4 transition-colors group-hover:underline"
                  >
                    {post.title}
                  </Link>
                </h3>

                {post.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1">
                    {post.tags.map((t) => (
                      <Link
                        key={t}
                        href={`/notes?tag=${encodeURIComponent(t)}`}
                        className="text-ink-soft/70 hover:text-accent font-mono text-[0.65rem] transition-colors"
                      >
                        #{t}
                      </Link>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {shown.length === 0 && (
          <p className="text-ink-soft py-6 text-center text-sm">
            {active
              ? "No entries under this topic yet."
              : "Nothing written yet — the first entry is waiting."}
          </p>
        )}
      </div>
    </RoomShell>
  );
}
