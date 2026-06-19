"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Book, Rendition } from "epubjs";
import {
  bookFileUrl,
  createAnnotation,
  deleteAnnotation,
  fetchAnnotations,
} from "@/app/lib/api";
import type { Annotation } from "@/app/lib/types";

interface ReaderProps {
  bookId: string;
  onClose: () => void;
}

// A passage the reader just selected but hasn't commented on yet.
interface PendingSelection {
  cfiRange: string;
  text: string;
}

// How often we poll for notes other readers have added.
const POLL_MS = 5000;

const MINE_STYLE = { fill: "#fbbf24", "fill-opacity": "0.35" };
const OTHERS_STYLE = { fill: "#60a5fa", "fill-opacity": "0.30" };

function addHighlight(rendition: Rendition, cfiRange: string, mine: boolean) {
  rendition.annotations.add(
    "highlight",
    cfiRange,
    {},
    undefined,
    "sr-highlight",
    mine ? MINE_STYLE : OTHERS_STYLE,
  );
}

export default function Reader({ bookId, onClose }: ReaderProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<Rendition | null>(null);
  // Annotation ids whose highlights are currently drawn, so we only add/remove
  // the delta when the list changes (own saves or friends' notes via polling).
  const drawnRef = useRef<Map<string, string>>(new Map());

  const [title, setTitle] = useState("Reading…");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [pending, setPending] = useState<PendingSelection | null>(null);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);

  // Set up the book + rendition once per book.
  useEffect(() => {
    const container = viewerRef.current;
    if (!container) return;

    let destroyed = false;
    let localBook: Book | null = null;
    const drawn = drawnRef.current;

    (async () => {
      try {
        const res = await fetch(bookFileUrl(bookId));
        if (!res.ok) throw new Error(`Book load failed (${res.status})`);
        const data = await res.arrayBuffer();
        if (destroyed) return;

        const ePub = (await import("epubjs")).default;
        if (destroyed) return;

        const book = ePub(data);
        localBook = book;
        await book.ready;
        if (destroyed) return;

        const rendition = book.renderTo(container, {
          width: "100%",
          height: "100%",
          flow: "paginated",
          spread: "auto",
        });
        renditionRef.current = rendition;

        rendition.on("keyup", (e: KeyboardEvent) => {
          if (e.key === "ArrowLeft") rendition.prev();
          if (e.key === "ArrowRight") rendition.next();
        });

        rendition.on("selected", (cfiRange: string) => {
          book
            .getRange(cfiRange)
            .then((range) => {
              const text = range?.toString().trim() ?? "";
              if (text) setPending({ cfiRange, text });
            })
            .catch(() => {});
        });

        await rendition.display();
        if (destroyed) return;

        book.loaded.metadata
          .then((meta) => {
            if (!destroyed && meta?.title) setTitle(meta.title);
          })
          .catch(() => {});

        setReady(true);
        book.locations.generate(1000).catch(() => {});
      } catch (e) {
        if (!destroyed) {
          setError("Couldn't open this book.");
          console.error(e);
        }
      }
    })();

    return () => {
      destroyed = true;
      localBook?.destroy();
      renditionRef.current = null;
      drawn.clear();
    };
  }, [bookId]);

  // Load notes once ready, then poll so friends' notes show up live.
  useEffect(() => {
    if (!ready) return;
    let active = true;

    const load = () =>
      fetchAnnotations(bookId)
        .then((list) => {
          if (active) setAnnotations(list);
        })
        .catch(() => {});

    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [ready, bookId]);

  // Reconcile drawn highlights with the current annotation list.
  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition || !ready) return;

    const drawn = drawnRef.current;
    const next = new Set(annotations.map((a) => a.id));

    // Remove highlights for notes that are gone.
    for (const [id, cfiRange] of drawn) {
      if (!next.has(id)) {
        rendition.annotations.remove(cfiRange, "highlight");
        drawn.delete(id);
      }
    }
    // Add highlights for notes we haven't drawn yet.
    for (const a of annotations) {
      if (!drawn.has(a.id)) {
        addHighlight(rendition, a.cfiRange, a.mine);
        drawn.set(a.id, a.cfiRange);
      }
    }
  }, [annotations, ready]);

  const goPrev = useCallback(() => renditionRef.current?.prev(), []);
  const goNext = useCallback(() => renditionRef.current?.next(), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext]);

  async function saveComment() {
    if (!pending) return;
    const selection = pending;
    const comment = draft.trim();
    setPending(null);
    setDraft("");
    try {
      const created = await createAnnotation(bookId, {
        cfiRange: selection.cfiRange,
        text: selection.text,
        comment,
      });
      setAnnotations((prev) => [...prev, created]);
    } catch (e) {
      console.error(e);
      setError("Couldn't save your note.");
    }
  }

  async function removeAnnotation(a: Annotation) {
    setAnnotations((prev) => prev.filter((x) => x.id !== a.id));
    try {
      await deleteAnnotation(a.id);
    } catch (e) {
      console.error(e);
    }
  }

  function jumpTo(cfiRange: string) {
    renditionRef.current?.display(cfiRange);
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <button
          onClick={onClose}
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Library
        </button>
        <h1 className="truncate px-4 text-sm font-medium text-zinc-700 dark:text-zinc-200">
          {title}
        </h1>
        <button
          onClick={share}
          className="rounded-md border border-zinc-300 px-2.5 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {copied ? "Link copied!" : "Share"}
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="relative flex min-w-0 flex-1 items-stretch">
          <button
            onClick={goPrev}
            aria-label="Previous page"
            className="px-3 text-2xl text-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            ‹
          </button>

          <div className="relative min-w-0 flex-1">
            <div ref={viewerRef} className="h-full w-full" />
            {!ready && !error && (
              <p className="absolute inset-0 flex items-center justify-center text-sm text-zinc-400">
                Opening book…
              </p>
            )}
            {error && (
              <p className="absolute inset-0 flex items-center justify-center text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>

          <button
            onClick={goNext}
            aria-label="Next page"
            className="px-3 text-2xl text-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            ›
          </button>
        </div>

        <aside className="flex w-80 shrink-0 flex-col border-l border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {pending && (
            <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
              <p className="mb-2 border-l-2 border-amber-400 pl-2 text-sm text-zinc-600 italic dark:text-zinc-300">
                “{pending.text}”
              </p>
              <textarea
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add a note in the margin…"
                className="h-20 w-full resize-none rounded-md border border-zinc-300 bg-transparent p-2 text-sm outline-none focus:border-amber-400 dark:border-zinc-700"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setPending(null);
                    setDraft("");
                  }}
                  className="rounded-md px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  onClick={saveComment}
                  className="rounded-md bg-amber-400 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-amber-300"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {annotations.length === 0 && !pending ? (
              <p className="text-sm text-zinc-400">
                Select any passage to highlight it and add a note. Notes are
                shared with everyone reading this book.
              </p>
            ) : (
              <ul className="space-y-3">
                {annotations.map((a) => (
                  <li
                    key={a.id}
                    className="group rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
                  >
                    <button
                      onClick={() => jumpTo(a.cfiRange)}
                      className="w-full text-left"
                    >
                      <p
                        className={`border-l-2 pl-2 text-sm text-zinc-600 dark:text-zinc-300 ${
                          a.mine ? "border-amber-400" : "border-blue-400"
                        }`}
                      >
                        “{a.text}”
                      </p>
                      {a.comment && (
                        <p className="mt-2 text-sm text-zinc-800 dark:text-zinc-100">
                          {a.comment}
                        </p>
                      )}
                    </button>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-zinc-400">
                        {a.mine ? "You" : a.authorName}
                      </span>
                      {a.mine && (
                        <button
                          onClick={() => removeAnnotation(a)}
                          aria-label="Delete note"
                          title="Delete note"
                          className="text-base text-zinc-400 transition-colors hover:text-red-500"
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
