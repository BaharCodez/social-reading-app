"use client";

import { useState } from "react";
import Link from "next/link";

export interface Step {
  id: string;
  order: number;
  group: string;
  title: string;
  detail: string;
  link: string | null;
  recallQ: string;
  recallA: string;
  done: boolean;
}

export default function RoadmapView({
  steps: initial,
  canEdit,
}: {
  steps: Step[];
  canEdit: boolean;
}) {
  const [steps, setSteps] = useState(initial);
  const [openRecall, setOpenRecall] = useState<Set<string>>(new Set());
  const [openAnswer, setOpenAnswer] = useState<Set<string>>(new Set());
  const [note, setNote] = useState<string | null>(null);

  const total = steps.length;
  const done = steps.filter((s) => s.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  // The next chunk to do: first one not yet ticked.
  const nextId = steps.find((s) => !s.done)?.id ?? null;

  const cheer =
    pct === 100
      ? "the whole path — done. 🎉"
      : pct === 0
        ? "start with just one chunk. that's the whole trick."
        : `${pct}% of the way — keep chipping.`;

  function toggleSet(
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    id: string,
  ) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function toggleDone(step: Step) {
    if (!canEdit) {
      setNote("Sign in as the owner to track your progress.");
      return;
    }
    const nextDone = !step.done;
    setSteps((s) =>
      s.map((x) => (x.id === step.id ? { ...x, done: nextDone } : x)),
    );
    const res = await fetch(`/api/roadmap-steps/${step.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: nextDone }),
    });
    if (!res.ok) {
      setSteps((s) =>
        s.map((x) => (x.id === step.id ? { ...x, done: step.done } : x)),
      );
      setNote("Couldn't save that — sign in as the owner.");
    }
  }

  // Precompute where a new group header should appear (no render-time mutation).
  const rows = steps.map((step, i) => ({
    step,
    showGroup: !!step.group && step.group !== (steps[i - 1]?.group ?? ""),
  }));

  return (
    <div className="mx-auto w-full max-w-2xl px-6 pb-20 sm:px-8">
      {/* progress */}
      <div className="border-line bg-surface mb-8 rounded-sm border p-5">
        <div className="flex items-baseline justify-between">
          <span className="text-accent-2 font-mono text-xs tracking-[0.2em] uppercase">
            your progress
          </span>
          <span className="text-ink font-mono text-sm font-bold">
            {done} / {total}
          </span>
        </div>
        <div className="bg-ink/10 mt-3 h-2 overflow-hidden rounded-full">
          <div
            className="bg-accent h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-ink-soft mt-2 text-sm">{cheer}</p>
      </div>

      {note && (
        <p className="text-accent-2 mb-4 text-center text-xs font-medium">
          {note}
        </p>
      )}

      {/* the path */}
      <ol className="relative">
        {rows.map(({ step, showGroup }) => {
          const isNext = step.id === nextId;
          return (
            <li key={step.id}>
              {showGroup && (
                <h3 className="text-accent-2 mt-6 mb-2 font-mono text-[11px] tracking-[0.2em] uppercase first:mt-0">
                  {step.group}
                </h3>
              )}
              <div className="flex gap-3">
                {/* node + connector */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => toggleDone(step)}
                    aria-label={step.done ? "mark not done" : "mark done"}
                    title={
                      canEdit
                        ? step.done
                          ? "tick off"
                          : "mark this chunk done"
                        : "sign in to track progress"
                    }
                    className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] transition-colors ${
                      step.done
                        ? "border-accent bg-accent text-accent-ink"
                        : isNext
                          ? "border-accent text-accent"
                          : "border-line text-transparent"
                    }`}
                  >
                    ✓
                  </button>
                  <span className="bg-line my-1 w-px flex-1" />
                </div>

                {/* content */}
                <div className="min-w-0 flex-1 pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`font-serif text-base ${
                        step.done ? "text-ink-soft line-through" : "text-ink"
                      }`}
                    >
                      {step.title}
                    </span>
                    {isNext && (
                      <span className="bg-accent/15 text-accent rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase">
                        up next
                      </span>
                    )}
                  </div>
                  {step.detail && (
                    <p className="text-ink-soft mt-1 text-sm">{step.detail}</p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {step.link && (
                      <a
                        href={step.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent font-mono text-xs hover:underline"
                      >
                        read it ↗
                      </a>
                    )}
                    {step.recallQ && (
                      <button
                        type="button"
                        onClick={() => toggleSet(setOpenRecall, step.id)}
                        className="text-ink-soft hover:text-ink font-mono text-xs"
                      >
                        🧠 {openRecall.has(step.id) ? "hide" : "test yourself"}
                      </button>
                    )}
                  </div>

                  {step.recallQ && openRecall.has(step.id) && (
                    <div className="border-line bg-bg-2/40 mt-2 rounded-sm border p-3">
                      <p className="text-ink text-sm italic">{step.recallQ}</p>
                      {openAnswer.has(step.id) ? (
                        <p className="text-ink-soft mt-2 text-sm leading-relaxed">
                          {step.recallA}
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleSet(setOpenAnswer, step.id)}
                          className="text-accent mt-2 font-mono text-xs hover:underline"
                        >
                          reveal answer
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {done === total && total > 0 && (
        <p className="text-ink mt-4 text-center font-serif text-lg">
          You finished the whole path. 🎉
        </p>
      )}

      {!canEdit && (
        <p className="text-ink-soft mt-8 text-center font-mono text-xs">
          <Link href="/login" className="text-accent hover:underline">
            sign in
          </Link>{" "}
          as the owner to track your progress.
        </p>
      )}
    </div>
  );
}
