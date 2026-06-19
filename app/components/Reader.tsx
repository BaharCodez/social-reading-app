"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Book, Rendition } from "epubjs";
import {
  deleteAnnotation,
  getAnnotations,
  saveAnnotation,
  type StoredAnnotation,
} from "@/app/lib/library";

interface ReaderProps {
  bookData: ArrayBuffer;
  bookId: string;
  title: string;
  onClose: () => void;
}

// A passage the reader just selected but hasn't commented on yet.
interface PendingSelection {
  cfiRange: string;
  text: string;
}

const HIGHLIGHT_STYLES = { fill: "#fbbf24", "fill-opacity": "0.35" };

function addHighlight(rendition: Rendition, cfiRange: string) {
  rendition.annotations.add(
    "highlight",
    cfiRange,
    {},
    undefined,
    "sr-highlight",
    HIGHLIGHT_STYLES,
  );
}

export default function Reader({
  bookData,
  bookId,
  title: initialTitle,
  onClose,
}: ReaderProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<Book | null>(null);
  const renditionRef = useRef<Rendition | null>(null);

  const [title, setTitle] = useState(initialTitle);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<StoredAnnotation[]>([]);
  const [pending, setPending] = useState<PendingSelection | null>(null);
  const [draft, setDraft] = useState("");

  // Set up the book + rendition once, on mount.
  useEffect(() => {
    const container = viewerRef.current;
    if (!container) return;

    // Local handles so cleanup destroys *this* effect's book, never a
    // newer one created by StrictMode's double-mount in dev.
    let destroyed = false;
    let localBook: Book | null = null;

    (async () => {
      try {
        const ePub = (await import("epubjs")).default;
        if (destroyed) return;

        const book = ePub(bookData);
        localBook = book;
        bookRef.current = book;

        // Wait until the spine is parsed before rendering, otherwise
        // navigation can no-op on books that load slowly.
        await book.ready;
        if (destroyed) return;

        const rendition = book.renderTo(container, {
          width: "100%",
          height: "100%",
          flow: "paginated",
          spread: "auto",
        });
        renditionRef.current = rendition;

        // Arrow keys fired *inside* the book's iframe don't reach the
        // page, so forward them here too.
        rendition.on("keyup", (e: KeyboardEvent) => {
          if (e.key === "ArrowLeft") rendition.prev();
          if (e.key === "ArrowRight") rendition.next();
        });

        // When the reader selects text, capture the range + its text.
        rendition.on("selected", (cfiRange: string) => {
          book
            .getRange(cfiRange)
            .then((range) => {
              const text = range?.toString().trim() ?? "";
              if (text) setPending({ cfiRange, text });
            })
            .catch(() => {
              /* range not resolvable — ignore */
            });
        });

        await rendition.display();
        if (destroyed) return;

        book.loaded.metadata
          .then((meta) => {
            if (!destroyed && meta?.title) setTitle(meta.title);
          })
          .catch(() => {});

        // Restore previously saved highlights + notes for this book.
        const stored = await getAnnotations(bookId);
        if (destroyed) return;
        for (const a of stored) addHighlight(rendition, a.cfiRange);
        setAnnotations(stored);

        setReady(true);

        // Build a page map in the background so progress/pagination is stable.
        book.locations.generate(1000).catch(() => {});
      } catch (e) {
        if (!destroyed) {
          setError("Couldn't open this EPUB. It may be corrupted.");
          console.error(e);
        }
      }
    })();

    return () => {
      destroyed = true;
      localBook?.destroy();
      bookRef.current = null;
      renditionRef.current = null;
    };
  }, [bookData, bookId]);

  const goPrev = useCallback(() => renditionRef.current?.prev(), []);
  const goNext = useCallback(() => renditionRef.current?.next(), []);

  // Arrow keys turn pages.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext]);

  function saveComment() {
    if (!pending) return;
    const rendition = renditionRef.current;
    const annotation: StoredAnnotation = {
      id: crypto.randomUUID(),
      bookId,
      cfiRange: pending.cfiRange,
      text: pending.text,
      comment: draft.trim(),
      createdAt: Date.now(),
    };

    if (rendition) addHighlight(rendition, pending.cfiRange);

    setAnnotations((prev) => [...prev, annotation]);
    setPending(null);
    setDraft("");

    // Persist in the background; the UI already reflects the change.
    saveAnnotation(annotation).catch((e) => console.error(e));
  }

  function removeAnnotation(annotation: StoredAnnotation) {
    renditionRef.current?.annotations.remove(annotation.cfiRange, "highlight");
    setAnnotations((prev) => prev.filter((a) => a.id !== annotation.id));
    deleteAnnotation(annotation.id).catch((e) => console.error(e));
  }

  function jumpTo(cfiRange: string) {
    renditionRef.current?.display(cfiRange);
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Top bar */}
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
        <span className="text-sm text-zinc-400">
          {annotations.length} note{annotations.length === 1 ? "" : "s"}
        </span>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Reading area */}
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

        {/* Margin: notes + pending comment composer */}
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
                Select any passage to highlight it and add a note.
              </p>
            ) : (
              <ul className="space-y-3">
                {annotations.map((a) => (
                  <li
                    key={a.id}
                    className="group rounded-md border border-zinc-200 p-3 hover:border-amber-300 dark:border-zinc-800"
                  >
                    <button
                      onClick={() => jumpTo(a.cfiRange)}
                      className="w-full text-left"
                    >
                      <p className="border-l-2 border-amber-400 pl-2 text-sm text-zinc-600 dark:text-zinc-300">
                        “{a.text}”
                      </p>
                      {a.comment && (
                        <p className="mt-2 text-sm text-zinc-800 dark:text-zinc-100">
                          {a.comment}
                        </p>
                      )}
                    </button>
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={() => removeAnnotation(a)}
                        className="text-xs text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
                      >
                        Delete
                      </button>
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
