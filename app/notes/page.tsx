import type { Metadata } from "next";
import Link from "next/link";
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
  const posts = await prisma.post.findMany({
    orderBy: [{ publishedAt: { sort: "desc", nulls: "first" } }],
    select: { id: true, title: true, content: true, publishedAt: true },
  });

  return (
    <RoomShell title="writing room">
      <div className="mx-auto w-full max-w-3xl px-4 pb-12 sm:px-6">
        {/* masthead */}
        <div className="border-ink flex items-end justify-between gap-4 border-b-4 pb-3">
          <div>
            <h2 className="text-ink font-serif text-6xl font-black tracking-tight sm:text-7xl">
              NOTES
            </h2>
            <p className="text-ink-soft mt-1 font-mono text-xs tracking-widest uppercase">
              reads · builds · writes
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2 pb-1">
            <Link
              href="/notes/board"
              className="rotate-2 bg-amber-200 px-3 py-2 text-xs font-medium text-stone-800 shadow-[3px_4px_0_rgba(0,0,0,0.15)] transition-transform hover:rotate-0"
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

        {/* ticker */}
        <div className="border-ink text-ink overflow-hidden border-b-4 py-2 whitespace-nowrap">
          <div className="ticker-track inline-block font-mono text-sm">
            <span>{TICKER}</span>
            <span aria-hidden>{TICKER}</span>
          </div>
        </div>

        {/* now reading / currently building */}
        <div className="border-ink grid grid-cols-1 border-b-4 sm:grid-cols-2">
          <div className="border-ink py-5 pr-5 max-sm:border-b-4 sm:border-r-4">
            <h3 className="font-pixel text-ink-soft text-xs tracking-wider uppercase">
              now reading
            </h3>
            <p className="text-ink mt-2 font-serif text-2xl font-semibold">
              — pick a book off the shelf —
            </p>
            <div className="mt-3 flex items-center gap-2 font-mono text-xs">
              <div className="bg-ink/10 h-2 flex-1">
                <div className="bg-accent h-2 w-0" />
              </div>
              <span className="text-ink-soft">0%</span>
            </div>
          </div>
          <div className="py-5 sm:pl-5">
            <h3 className="font-pixel text-ink-soft text-xs tracking-wider uppercase">
              currently building
            </h3>
            <p className="text-ink mt-2 font-serif text-2xl font-semibold">
              ESP32 plant waterer ⚡
            </p>
            <p className="text-ink-soft mt-3 font-mono text-xs">
              status: parts on the desk
            </p>
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
