import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/app/lib/prisma";
import RoomShell from "@/app/components/RoomShell";

export const metadata: Metadata = {
  title: "writing room — bahar's house",
  description: "Notes on what I'm reading and what I'm building.",
};

const TICKER =
  "now: turning this site into a pixel house ✳ reading: pick a book off the shelf ✳ building: esp32 plant waterer ✳ ";

/* Rough markdown → plain text for entry previews. */
function excerpt(md: string, len = 180) {
  const text = md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > len ? `${text.slice(0, len).trimEnd()}…` : text;
}

function stamp(date: Date) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}.${dd}`;
}

export default async function NotesPage() {
  // Render per request — entries change, and CI builds have no database.
  await connection();
  const posts = await prisma.post.findMany({
    orderBy: [{ publishedAt: { sort: "desc", nulls: "first" } }],
    select: { id: true, title: true, content: true, publishedAt: true },
  });

  return (
    <RoomShell
      title="writing room"
      heading="The Writing Room"
      tagline="notes, learning & essays"
      image={{
        src: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=1200&h=400&fit=crop&auto=format",
        alt: "An open notebook and pen on a desk",
      }}
    >
      <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-12 sm:px-6">
        {/* actions */}
        <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
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

        {/* ticker */}
        <div className="border-ink text-ink overflow-hidden border-b-4 py-2 whitespace-nowrap">
          <div className="ticker-track inline-block font-mono text-sm">
            <span>{TICKER}</span>
            <span aria-hidden>{TICKER}</span>
          </div>
        </div>

        {/* entries */}
        <div className="mt-6 space-y-6">
          {posts.map((post) => (
            <article key={post.id} className="flex gap-4 sm:gap-6">
              <span className="text-accent-2 w-12 shrink-0 pt-1 font-mono text-sm font-bold">
                {post.publishedAt ? stamp(post.publishedAt) : "draft"}
              </span>
              <div className="min-w-0">
                <h3 className="text-ink font-serif text-xl font-bold">
                  <Link
                    href={
                      post.publishedAt
                        ? `/notes/${post.id}`
                        : `/notes/write?id=${post.id}`
                    }
                    className="hover:text-accent underline-offset-4 hover:underline"
                  >
                    {post.title}
                  </Link>
                </h3>
                {excerpt(post.content) && (
                  <p className="text-ink-soft mt-1 text-sm leading-relaxed">
                    {excerpt(post.content)}
                  </p>
                )}
              </div>
            </article>
          ))}
          {posts.length === 0 && (
            <p className="text-ink-soft py-6 text-center text-sm">
              Nothing written yet — the first entry is waiting.
            </p>
          )}
        </div>
      </div>
    </RoomShell>
  );
}
