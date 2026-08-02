import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { isOwner } from "@/app/lib/session";
import RoomShell from "@/app/components/RoomShell";

export const metadata: Metadata = {
  title: "roadmaps — bahar's house",
  description: "Self-paced learning paths, one small chunk at a time.",
  // The whole room is owner-only — keep it out of search too.
  robots: { index: false, follow: false },
};

export default async function RoadmapsPage() {
  await connection();
  // Roadmaps is a private room: only the owner may see it. Others get a 404.
  if (!(await isOwner())) notFound();
  const roadmaps = await prisma.roadmap.findMany({
    orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
    select: {
      slug: true,
      title: true,
      subtitle: true,
      emoji: true,
      private: true,
      steps: { select: { done: true } },
    },
  });

  return (
    <RoomShell
      title="roadmaps"
      heading="Roadmaps"
      tagline="one small chunk at a time — read it, test yourself, tick it off. it only moves when you do."
      image={{
        src: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=1200&h=400&fit=crop&auto=format",
        alt: "A winding path through greenery",
      }}
    >
      <div className="mx-auto grid w-full max-w-3xl gap-5 px-6 pb-16 sm:px-8">
        {roadmaps.map((r) => {
          const total = r.steps.length;
          const done = r.steps.filter((s) => s.done).length;
          const pct = total ? Math.round((done / total) * 100) : 0;
          return (
            <Link
              key={r.slug}
              href={`/roadmaps/${r.slug}`}
              className="border-line bg-surface hover:border-accent group rounded-sm border p-5 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{r.emoji}</span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-ink flex items-center gap-2 font-serif text-xl">
                    {r.title}
                    {r.private && (
                      <span className="bg-ink/10 text-ink-soft rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase">
                        🔒 private
                      </span>
                    )}
                  </h2>
                  {r.subtitle && (
                    <p className="text-ink-soft mt-0.5 text-sm">{r.subtitle}</p>
                  )}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="bg-ink/10 h-1.5 flex-1 overflow-hidden rounded-full">
                      <div
                        className="bg-accent h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-accent-2 shrink-0 font-mono text-xs font-bold">
                      {done}/{total}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
        {roadmaps.length === 0 && (
          <p className="text-ink-soft text-sm">No roadmaps yet.</p>
        )}
      </div>
    </RoomShell>
  );
}
