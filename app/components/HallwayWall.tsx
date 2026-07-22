"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface Frame {
  id: string;
  kind: string; // "job" | "project" | "achievement"
  title: string;
  subtitle: string;
  detail: string;
  years: string | null;
  link: string | null;
}

const KIND_LABEL: Record<string, string> = {
  job: "job",
  project: "project",
  achievement: "achievement",
};

const POSTER_ACCENTS = ["bg-accent", "bg-accent-2", "bg-ink-soft/60"];

/* One poster in a pixel frame. */
function FrameControls({
  frame,
  onEdit,
  onRemove,
}: {
  frame: Frame;
  onEdit: (frame: Frame) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="absolute -top-2 -right-2 z-10 flex gap-1">
      <button
        type="button"
        onClick={() => onEdit(frame)}
        aria-label={`Edit ${frame.title}`}
        title="rewrite this frame"
        className="text-ink-soft hover:text-accent flex h-6 w-6 items-center justify-center rounded-full border-2 border-current bg-[var(--surface)] text-xs transition-colors"
      >
        ✎
      </button>
      <button
        type="button"
        onClick={() => onRemove(frame.id)}
        aria-label={`Take down ${frame.title}`}
        title="take this frame down"
        className="text-ink-soft flex h-6 w-6 items-center justify-center rounded-full border-2 border-current bg-[var(--surface)] text-xs transition-colors hover:text-red-500"
      >
        ✕
      </button>
    </div>
  );
}

function Poster({
  frame,
  accent,
  canEdit,
  onEdit,
  onRemove,
}: {
  frame: Frame;
  accent: string;
  canEdit: boolean;
  onEdit: (frame: Frame) => void;
  onRemove: (id: string) => void;
}) {
  const inner = (
    <div className={`${accent} flex h-28 flex-col justify-end p-2 sm:h-32`}>
      {frame.years && (
        <span className="font-mono text-[10px] text-white/80">
          {frame.years}
        </span>
      )}
      <span className="font-pixel text-accent-ink text-lg leading-tight">
        {frame.title}
      </span>
    </div>
  );
  return (
    <div className="pixel-frame bg-surface relative flex flex-col p-3">
      {canEdit && (
        <FrameControls frame={frame} onEdit={onEdit} onRemove={onRemove} />
      )}
      {frame.link ? (
        <a href={frame.link} target="_blank" rel="noreferrer" className="group">
          {inner}
        </a>
      ) : (
        inner
      )}
      {frame.subtitle && (
        <p className="text-ink mt-3 text-sm font-medium">{frame.subtitle}</p>
      )}
      {frame.detail && (
        <p className="text-ink-soft mt-1 font-mono text-xs whitespace-pre-line">
          {frame.detail}
        </p>
      )}
    </div>
  );
}

/* A brass-plaque row for a job. */
function Plaque({
  frame,
  canEdit,
  onEdit,
  onRemove,
}: {
  frame: Frame;
  canEdit: boolean;
  onEdit: (frame: Frame) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="pixel-frame bg-surface relative flex items-baseline gap-4 px-4 py-3">
      {canEdit && (
        <FrameControls frame={frame} onEdit={onEdit} onRemove={onRemove} />
      )}
      <span className="text-accent-2 w-24 shrink-0 font-mono text-xs font-bold">
        {frame.years ?? "—"}
      </span>
      <div className="min-w-0">
        <p className="font-pixel text-ink text-base">
          {frame.link ? (
            <a
              href={frame.link}
              target="_blank"
              rel="noreferrer"
              className="hover:text-accent underline-offset-2 hover:underline"
            >
              {frame.title}
            </a>
          ) : (
            frame.title
          )}
        </p>
        {frame.subtitle && (
          <p className="text-ink-soft text-sm">{frame.subtitle}</p>
        )}
        {frame.detail && (
          <p className="text-ink-soft mt-0.5 font-mono text-xs whitespace-pre-line">
            {frame.detail}
          </p>
        )}
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  kind: "project",
  title: "",
  subtitle: "",
  detail: "",
  years: "",
  link: "",
};

export default function HallwayWall({
  frames,
  canEdit,
}: {
  frames: Frame[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jobs = frames.filter((f) => f.kind === "job");
  const posters = frames.filter((f) => f.kind !== "job");

  function startEdit(frame: Frame) {
    setForm({
      kind: frame.kind,
      title: frame.title,
      subtitle: frame.subtitle,
      detail: frame.detail,
      years: frame.years ?? "",
      link: frame.link ?? "",
    });
    setEditingId(frame.id);
    setAdding(true);
  }

  function closeForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setAdding(false);
    setError(null);
  }

  async function hangFrame(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        editingId ? `/api/frames/${editingId}` : "/api/frames",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't hang that frame.");
        return;
      }
      closeForm();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeFrame(id: string) {
    await fetch(`/api/frames/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const field =
    "border-line text-ink focus:border-accent w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-10 sm:px-6">
      {/* the career wall */}
      {jobs.length > 0 && (
        <section className="mb-8">
          <h2 className="font-pixel text-ink-soft mb-3 text-xs tracking-wider uppercase">
            places I&apos;ve worked
          </h2>
          <div className="space-y-3">
            {jobs.map((f) => (
              <Plaque
                key={f.id}
                frame={f}
                canEdit={canEdit}
                onEdit={startEdit}
                onRemove={removeFrame}
              />
            ))}
          </div>
        </section>
      )}

      {/* posters: projects + achievements */}
      {posters.length > 0 && (
        <section>
          <h2 className="font-pixel text-ink-soft mb-3 text-xs tracking-wider uppercase">
            things I&apos;ve made &amp; done
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {posters.map((f, i) => (
              <Poster
                key={f.id}
                frame={f}
                accent={POSTER_ACCENTS[i % POSTER_ACCENTS.length]}
                canEdit={canEdit}
                onEdit={startEdit}
                onRemove={removeFrame}
              />
            ))}
          </div>
        </section>
      )}

      {frames.length === 0 && (
        <div className="pixel-frame bg-surface flex flex-col items-center gap-2 p-8 text-center">
          <div className="border-shelf-edge bg-bg flex h-20 w-16 items-center justify-center border-4">
            <span className="text-ink-soft text-2xl">?</span>
          </div>
          <p className="text-ink-soft text-sm">
            The wall is bare — nothing has been hung up yet.
          </p>
        </div>
      )}

      {/* curator mode */}
      {canEdit && (
        <div className="mt-10">
          {adding ? (
            <form
              onSubmit={hangFrame}
              className="pixel-frame bg-surface space-y-3 p-4"
            >
              <div className="flex items-center gap-3">
                <h3 className="font-pixel text-ink text-sm">
                  {editingId ? "rewrite this frame" : "hang a new frame"}
                </h3>
                <select
                  value={form.kind}
                  onChange={(e) => setForm({ ...form, kind: e.target.value })}
                  className="border-line text-ink ml-auto rounded-lg border bg-transparent px-2 py-1 text-sm outline-none"
                >
                  {Object.entries(KIND_LABEL).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <input
                className={field}
                placeholder="Title (e.g. UserTesting — QA Engineer, or ESP32 plant waterer)"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <input
                className={field}
                placeholder="One-liner (what was it / what did you do?)"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />
              <textarea
                className={`${field} min-h-20 resize-y`}
                placeholder="Small print — tech, outcome, the story. As many words as you like; line breaks are kept."
                value={form.detail}
                onChange={(e) => setForm({ ...form, detail: e.target.value })}
              />
              <div className="flex gap-3">
                <input
                  className={field}
                  placeholder="Years (e.g. 2023–now)"
                  value={form.years}
                  onChange={(e) => setForm({ ...form, years: e.target.value })}
                />
                <input
                  className={field}
                  placeholder="Link (optional)"
                  type="url"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="bg-accent text-accent-ink font-pixel rounded-full px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
                >
                  {busy ? "saving…" : editingId ? "save changes" : "hang it up"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="text-ink-soft hover:text-ink px-3 text-sm"
                >
                  never mind
                </button>
              </div>
            </form>
          ) : (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="font-pixel text-ink-soft hover:text-ink border-line hover:border-accent rounded border-2 border-dashed px-4 py-2 text-sm transition-colors"
              >
                + hang a frame
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
