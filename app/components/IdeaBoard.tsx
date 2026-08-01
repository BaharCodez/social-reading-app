"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface Idea {
  id: string;
  bucket: string;
  text: string;
  done: boolean;
}

// Soft cottage note colours — pressed-flower tints on parchment.
const BUCKETS = [
  {
    key: "read",
    label: "read about",
    note: "bg-[#F1E3C2]",
    tape: "bg-[#D8BE86]/60",
  },
  {
    key: "write",
    label: "write about",
    note: "bg-[#DCE5D3]",
    tape: "bg-[#A9BE9E]/60",
  },
  {
    key: "explore",
    label: "explore",
    note: "bg-[#E3E7CB]",
    tape: "bg-[#B9C48A]/60",
  },
  {
    key: "solve",
    label: "solve",
    note: "bg-[#EAD6C6]",
    tape: "bg-[#C79E86]/60",
  },
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
      className={`${bucket.note} ${tilt} relative p-3 pt-4 text-sm text-[#2A1F0E] shadow-[3px_4px_0_rgba(42,31,14,0.12)] transition-transform hover:rotate-0`}
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
            className="text-[#6B5A3E] hover:text-[#2A1F0E]"
            title={idea.done ? "not done after all" : "mark done"}
          >
            {idea.done ? "↺ undo" : "✓ done"}
          </button>
          <button
            type="button"
            onClick={() => onRemove(idea.id)}
            className="ml-auto text-[#8A7550] hover:text-[#9B4E2E]"
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
  const [note, setNote] = useState<string | null>(null);

  async function pin(bucket: string) {
    const text = (drafts[bucket] ?? "").trim();
    if (!text) return;
    setNote(null);
    const res = await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bucket, text }),
    });
    if (res.ok) {
      // Only clear the draft once it's safely pinned.
      setDrafts((d) => ({ ...d, [bucket]: "" }));
      router.refresh();
    } else {
      setNote("Sign in as the owner to pin ideas.");
    }
  }

  async function toggle(idea: Idea) {
    const res = await fetch(`/api/ideas/${idea.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !idea.done }),
    });
    if (res.ok) router.refresh();
    else setNote("Sign in as the owner to change the board.");
  }

  async function remove(id: string) {
    const res = await fetch(`/api/ideas/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else setNote("Sign in as the owner to change the board.");
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

      {note && (
        <p className="text-accent-2 mt-4 text-center text-xs font-medium">
          {note}
        </p>
      )}

      <p className="text-ink-soft mt-4 text-center text-xs">
        ideas graduate from the board into{" "}
        <span className="text-ink">real posts</span> next door — pin freely,
        solve slowly.
      </p>
    </div>
  );
}
