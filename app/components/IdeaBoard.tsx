"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface Idea {
  id: string;
  bucket: string;
  text: string;
  done: boolean;
}

const BUCKETS = [
  {
    key: "read",
    label: "read about",
    note: "bg-amber-200",
    tape: "bg-amber-400/50",
  },
  {
    key: "write",
    label: "write about",
    note: "bg-sky-200",
    tape: "bg-sky-400/50",
  },
  {
    key: "explore",
    label: "explore",
    note: "bg-lime-200",
    tape: "bg-lime-500/40",
  },
  { key: "solve", label: "solve", note: "bg-rose-200", tape: "bg-rose-400/50" },
] as const;

function StickyNote({
  idea,
  bucket,
  tilt,
  canEdit,
  onToggle,
  onRemove,
}: {
  idea: Idea;
  bucket: (typeof BUCKETS)[number];
  tilt: string;
  canEdit: boolean;
  onToggle: (idea: Idea) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div
      className={`${bucket.note} ${tilt} relative p-3 pt-4 text-sm text-stone-800 shadow-[3px_4px_0_rgba(0,0,0,0.15)] transition-transform hover:rotate-0`}
    >
      {/* tape */}
      <span
        className={`${bucket.tape} absolute -top-1.5 left-1/2 h-3 w-10 -translate-x-1/2`}
      />
      <p className={idea.done ? "line-through opacity-50" : ""}>{idea.text}</p>
      {canEdit && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => onToggle(idea)}
            className="text-stone-600 hover:text-stone-900"
            title={idea.done ? "not done after all" : "mark done"}
          >
            {idea.done ? "↺ undo" : "✓ done"}
          </button>
          <button
            type="button"
            onClick={() => onRemove(idea.id)}
            className="ml-auto text-stone-500 hover:text-red-600"
            title="unpin this note"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default function IdeaBoard({
  ideas,
  canEdit,
}: {
  ideas: Idea[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  async function pin(bucket: string) {
    const text = (drafts[bucket] ?? "").trim();
    if (!text) return;
    setDrafts((d) => ({ ...d, [bucket]: "" }));
    await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bucket, text }),
    });
    router.refresh();
  }

  async function toggle(idea: Idea) {
    await fetch(`/api/ideas/${idea.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !idea.done }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/ideas/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-12 sm:px-6">
      {/* the corkboard */}
      <div className="pixel-frame bg-[color-mix(in_srgb,var(--shelf)_55%,var(--bg))] p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BUCKETS.map((bucket) => {
            const notes = ideas.filter((i) => i.bucket === bucket.key);
            return (
              <section key={bucket.key} className="flex flex-col gap-3">
                <h2 className="font-pixel text-accent-ink bg-shelf-edge self-start px-2 py-1 text-xs tracking-wider">
                  {bucket.label}
                </h2>
                {notes.map((idea, i) => (
                  <StickyNote
                    key={idea.id}
                    idea={idea}
                    bucket={bucket}
                    tilt={i % 2 === 0 ? "rotate-1" : "-rotate-1"}
                    canEdit={canEdit}
                    onToggle={toggle}
                    onRemove={remove}
                  />
                ))}
                {notes.length === 0 && (
                  <p className="text-accent-ink/50 text-xs italic">
                    nothing pinned yet
                  </p>
                )}
                {canEdit && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void pin(bucket.key);
                    }}
                  >
                    <input
                      value={drafts[bucket.key] ?? ""}
                      onChange={(e) =>
                        setDrafts((d) => ({
                          ...d,
                          [bucket.key]: e.target.value,
                        }))
                      }
                      placeholder="+ pin an idea"
                      className="placeholder:text-accent-ink/40 text-accent-ink border-accent-ink/30 focus:border-accent-ink/70 w-full border-b-2 border-dashed bg-transparent px-1 py-1 text-sm outline-none"
                    />
                  </form>
                )}
              </section>
            );
          })}
        </div>
      </div>

      <p className="text-ink-soft mt-4 text-center text-xs">
        ideas graduate from the board into{" "}
        <span className="text-ink">real posts</span> next door — pin freely,
        solve slowly.
      </p>
    </div>
  );
}
