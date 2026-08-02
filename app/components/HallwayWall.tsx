"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface Frame {
  id: string;
  kind: string; // "job" | "project" | "achievement" | "sandbox" (workshop shelf)
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

const FILTER_LABEL: Record<string, string> = {
  job: "jobs",
  project: "projects",
  achievement: "achievements",
};

/* Owner-only edit / remove controls for a frame. */
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
    <span className="ml-2 flex shrink-0 gap-1">
      <button
        type="button"
        onClick={() => onEdit(frame)}
        aria-label={`Edit ${frame.title}`}
        title="rewrite this frame"
        className="text-ink-soft hover:text-accent text-xs transition-colors"
      >
        ✎
      </button>
      <button
        type="button"
        onClick={() => onRemove(frame.id)}
        aria-label={`Take down ${frame.title}`}
        title="take this frame down"
        className="text-ink-soft text-xs transition-colors hover:text-[#9B4E2E]"
      >
        ✕
      </button>
    </span>
  );
}

/* An expandable frame in the "made & done" column (interests-accordion style). */
function AccordionFrame({
  frame,
  isOpen,
  onToggle,
  canEdit,
  onEdit,
  onRemove,
}: {
  frame: Frame;
  isOpen: boolean;
  onToggle: () => void;
  canEdit: boolean;
  onEdit: (frame: Frame) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="border-line border-b">
      <div className="flex items-center">
        <button
          type="button"
          onClick={onToggle}
          className="group flex flex-1 items-center justify-between gap-3 py-3 text-left"
        >
          <span
            className={`font-serif text-base transition-colors ${
              isOpen ? "text-accent" : "text-ink group-hover:text-accent"
            }`}
          >
            {frame.title}
          </span>
          <span className="text-accent-2 shrink-0 font-mono text-lg">
            {isOpen ? "−" : "+"}
          </span>
        </button>
        {canEdit && (
          <FrameControls frame={frame} onEdit={onEdit} onRemove={onRemove} />
        )}
      </div>
      {isOpen && (
        <div className="fade-up pb-4">
          {frame.years && (
            <p className="text-accent-2 mb-1 font-mono text-xs font-bold">
              {frame.years}
            </p>
          )}
          {frame.subtitle && (
            <p className="text-ink text-sm leading-relaxed">{frame.subtitle}</p>
          )}
          {frame.detail && (
            <p className="text-ink-soft mt-2 font-mono text-xs leading-relaxed whitespace-pre-line">
              {frame.detail}
            </p>
          )}
          {frame.link && (
            <a
              href={frame.link}
              target="_blank"
              rel="noreferrer"
              className="text-accent mt-3 inline-block font-mono text-xs hover:underline"
            >
              visit ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/* A job in the "places I've worked" column. */
function JobRow({
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
    <div className="border-line border-b pb-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-ink font-serif text-base">
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
        </span>
        <span className="text-accent-2 flex shrink-0 items-baseline gap-1 font-mono text-xs font-bold">
          {frame.years ?? "—"}
          {canEdit && (
            <FrameControls frame={frame} onEdit={onEdit} onRemove={onRemove} />
          )}
        </span>
      </div>
      {frame.subtitle && (
        <p className="text-ink-soft mt-1 text-sm">{frame.subtitle}</p>
      )}
      {frame.detail && (
        <p className="text-ink-soft mt-1 font-mono text-xs whitespace-pre-line">
          {frame.detail}
        </p>
      )}
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
  const [filter, setFilter] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = filter ? frames.filter((f) => f.kind === filter) : frames;
  const jobs = visible.filter((f) => f.kind === "job");
  const posters = visible.filter((f) => f.kind !== "job");

  // Only offer a pill for a kind that actually hangs on the wall.
  const kinds = ["job", "project", "achievement"].filter((k) =>
    frames.some((f) => f.kind === k),
  );

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
    const res = await fetch(`/api/frames/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else setError("Sign in as the owner to change the wall.");
  }

  const field =
    "border-line text-ink focus:border-accent w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none";
  const pill = (active: boolean) =>
    `font-mono text-xs rounded-full px-3 py-1.5 transition-colors ${
      active
        ? "bg-accent text-accent-ink"
        : "border-line text-ink-soft hover:text-ink border"
    }`;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 pt-8 pb-16 sm:px-8">
      <p className="text-ink-soft mb-8 max-w-xl leading-relaxed">
        The things I&apos;ve built, the places I&apos;ve worked, and the wins
        worth framing. Open any one to read the story behind it.
      </p>

      {/* filter pills */}
      {kinds.length > 1 && (
        <div className="mb-10 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter(null)}
            className={pill(filter === null)}
          >
            everything
          </button>
          {kinds.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(filter === k ? null : k)}
              className={pill(filter === k)}
            >
              {FILTER_LABEL[k]}
            </button>
          ))}
        </div>
      )}

      {frames.length === 0 ? (
        <div className="border-line bg-surface rounded-sm border p-8 text-center">
          <p className="text-ink-soft text-sm">
            The wall is bare. Nothing has been hung up yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-10 md:grid-cols-2 md:gap-12">
          {/* made & done — accordion */}
          <div>
            <h2 className="text-accent-2 mb-5 font-mono text-xs tracking-[0.2em] uppercase">
              projects
            </h2>
            {posters.length > 0 ? (
              <div>
                {posters.map((f) => (
                  <AccordionFrame
                    key={f.id}
                    frame={f}
                    isOpen={openId === f.id}
                    onToggle={() => setOpenId(openId === f.id ? null : f.id)}
                    canEdit={canEdit}
                    onEdit={startEdit}
                    onRemove={removeFrame}
                  />
                ))}
              </div>
            ) : (
              <p className="text-ink-soft text-sm italic">nothing here yet</p>
            )}
          </div>

          {/* places I've worked */}
          <div>
            <h2 className="text-accent-2 mb-5 font-mono text-xs tracking-[0.2em] uppercase">
              places I&apos;ve worked
            </h2>
            {jobs.length > 0 ? (
              <div className="space-y-4">
                {jobs.map((f) => (
                  <JobRow
                    key={f.id}
                    frame={f}
                    canEdit={canEdit}
                    onEdit={startEdit}
                    onRemove={removeFrame}
                  />
                ))}
              </div>
            ) : (
              <p className="text-ink-soft text-sm italic">nothing here yet</p>
            )}

            <div className="border-line bg-surface mt-8 rounded-sm border p-5">
              <p className="text-accent-2 mb-2 font-mono text-xs tracking-[0.2em] uppercase">
                the wall keeps growing
              </p>
              <p className="text-ink-soft text-sm leading-relaxed">
                New frames go up as I build. Check back, or peek into the
                workshop for what&apos;s on the bench.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* curator mode */}
      {canEdit && (
        <div className="mt-12">
          {adding ? (
            <form
              onSubmit={hangFrame}
              className="border-line bg-surface space-y-3 rounded-sm border p-4"
            >
              <div className="flex items-center gap-3">
                <h3 className="text-ink font-serif text-base">
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
              {error && <p className="text-sm text-[#9B4E2E]">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="bg-accent text-accent-ink rounded-full px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
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
                className="text-ink-soft hover:text-ink border-line hover:border-accent rounded-full border border-dashed px-4 py-2 font-mono text-xs transition-colors"
              >
                + hang a frame
              </button>
            </div>
          )}
          {error && !adding && (
            <p className="text-accent-2 mt-3 text-center text-xs">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
