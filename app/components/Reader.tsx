"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Book, Rendition } from "epubjs";
import {
  bookFileUrl,
  createAnnotation,
  deleteAnnotation,
  fetchAnnotations,
  fetchProgress,
  saveProgress,
} from "@/app/lib/api";
import type { Annotation } from "@/app/lib/types";
import ThemePicker from "./ThemePicker";
import AmbientMusic from "./AmbientMusic";

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
  const bookRef = useRef<Book | null>(null);
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
  // On mobile the notes panel is a bottom sheet toggled open; on desktop it's
  // always the side column.
  const [panelOpen, setPanelOpen] = useState(false);
  // Reading progress (page X of Y), derived from epub.js locations.
  const [progress, setProgress] = useState<{
    cur: number;
    total: number;
  } | null>(null);
  // "paginated" = flip pages; "scrolled" = continuous vertical scroll.
  const [mode, setMode] = useState<"paginated" | "scrolled">("paginated");
  // Reader font size as a percentage; held in a ref too so the setup effect
  // can apply the saved size without re-running on every change.
  const [fontScale, setFontScale] = useState(100);
  const fontScaleRef = useRef(100);

  // Restore the saved reading mode (deferred so it doesn't run synchronously).
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (localStorage.getItem("readingMode") === "scrolled")
        setMode("scrolled");
    });
    return () => cancelAnimationFrame(id);
  }, []);

  function toggleMode() {
    setMode((m) => {
      const next = m === "paginated" ? "scrolled" : "paginated";
      localStorage.setItem("readingMode", next);
      return next;
    });
  }

  // Restore the saved font size (deferred so it doesn't run synchronously).
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const saved = Number(localStorage.getItem("fontScale"));
      if (saved >= 70 && saved <= 220) setFontScale(saved);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Apply font size live and keep the ref in sync for the setup effect.
  useEffect(() => {
    fontScaleRef.current = fontScale;
    renditionRef.current?.themes.fontSize(`${fontScale}%`);
  }, [fontScale]);

  function changeFont(delta: number) {
    setFontScale((s) => {
      const next = Math.min(220, Math.max(70, s + delta));
      localStorage.setItem("fontScale", String(next));
      return next;
    });
  }

  // Set up the book + rendition once per book.
  useEffect(() => {
    const container = viewerRef.current;
    if (!container) return;

    let destroyed = false;
    let localBook: Book | null = null;
    let saveTimer: ReturnType<typeof setTimeout> | null = null;
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
        bookRef.current = book;
        await book.ready;
        if (destroyed) return;

        const scrolled = mode === "scrolled";
        const rendition = book.renderTo(container, {
          width: "100%",
          height: "100%",
          flow: scrolled ? "scrolled" : "paginated",
          manager: scrolled ? "continuous" : "default",
          spread: "auto",
          // Preload further ahead in scroll mode so chapter boundaries don't
          // stutter as the next section loads in (default is 500/250).
          ...(scrolled ? { offset: 1500, offsetDelta: 750 } : {}),
        });
        renditionRef.current = rendition;

        rendition.on("keyup", (e: KeyboardEvent) => {
          if (e.key === "ArrowLeft") rendition.prev();
          if (e.key === "ArrowRight") rendition.next();
        });

        // Swipe to turn pages on touch (phone / iPad). Touch events fire inside
        // the book's iframe, so attach them to each rendered chapter document.
        rendition.hooks.content.register((contents: { document: Document }) => {
          const doc = contents.document;
          // Claim horizontal gestures so iOS Safari doesn't treat a sideways
          // swipe as its back-navigation (which kills our swipe handler).
          doc.documentElement.style.touchAction = "pan-y";
          if (doc.body) doc.body.style.touchAction = "pan-y";
          let startX: number | null = null;
          doc.addEventListener(
            "touchstart",
            (e: TouchEvent) => {
              startX = e.changedTouches[0].clientX;
            },
            { passive: true },
          );
          doc.addEventListener(
            "touchend",
            (e: TouchEvent) => {
              if (startX === null) return;
              const dx = e.changedTouches[0].clientX - startX;
              startX = null;
              // Don't turn the page if the user was selecting text (so
              // highlighting works on touch) or in scroll mode.
              const selecting = !!doc.getSelection()?.toString();
              if (selecting || scrolled) return;
              if (Math.abs(dx) > 45) {
                if (dx < 0) rendition.next();
                else rendition.prev();
              }
            },
            { passive: true },
          );
        });

        // Remember the reading position per user (synced via the server) and
        // show "page X of Y" as the reader moves. Debounce the save so page
        // turns don't hammer the API.
        rendition.on("relocated", (location: { start: { cfi: string } }) => {
          const cfi = location.start.cfi;
          if (saveTimer) clearTimeout(saveTimer);
          saveTimer = setTimeout(() => saveProgress(bookId, cfi), 1200);

          const total = book.locations.length();
          if (!total) return;
          const cur = book.locations.locationFromCfi(cfi) as unknown as number;
          setProgress({ cur: (cur ?? 0) + 1, total });
        });

        rendition.on("selected", (cfiRange: string) => {
          book
            .getRange(cfiRange)
            .then((range) => {
              const text = range?.toString().trim() ?? "";
              if (text) {
                setPending({ cfiRange, text });
                setPanelOpen(true);
              }
            })
            .catch(() => {});
        });

        // Resume where this user left off (synced across their devices).
        const savedCfi = await fetchProgress(bookId).catch(() => null);
        if (destroyed) return;
        await rendition.display(savedCfi ?? undefined);
        if (destroyed) return;

        rendition.themes.fontSize(`${fontScaleRef.current}%`);

        book.loaded.metadata
          .then((meta) => {
            if (!destroyed && meta?.title) setTitle(meta.title);
          })
          .catch(() => {});

        setReady(true);
        book.locations
          .generate(1000)
          .then(() => {
            if (destroyed) return;
            const loc = rendition.currentLocation() as
              | { start?: { cfi?: string } }
              | undefined;
            const cfi = loc?.start?.cfi;
            const total = book.locations.length();
            if (cfi && total) {
              const cur = book.locations.locationFromCfi(
                cfi,
              ) as unknown as number;
              setProgress({ cur: (cur ?? 0) + 1, total });
            }
          })
          .catch(() => {});
      } catch (e) {
        if (!destroyed) {
          setError("Couldn't open this book.");
          console.error(e);
        }
      }
    })();

    return () => {
      destroyed = true;
      if (saveTimer) clearTimeout(saveTimer);
      localBook?.destroy();
      renditionRef.current = null;
      bookRef.current = null;
      drawn.clear();
    };
  }, [bookId, mode]);

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

  // Jump to a page (location) via the progress slider.
  function goToPage(page: number) {
    const cfi = bookRef.current?.locations.cfiFromLocation(page - 1);
    if (cfi) renditionRef.current?.display(cfi);
  }

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
    <div className="bg-bg flex h-screen flex-col">
      <header className="border-line touch-scroll flex items-center gap-2 overflow-x-auto border-b px-3 py-3">
        <button
          onClick={onClose}
          className="text-ink-soft hover:text-ink shrink-0 text-sm"
        >
          ←<span className="hidden sm:inline"> Bookshelf</span>
        </button>
        <h1 className="text-ink max-w-[38vw] shrink-0 truncate px-1 font-serif text-base font-medium">
          {title}
        </h1>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="border-line text-ink-soft flex items-center rounded-full border">
            <button
              onClick={() => changeFont(-10)}
              aria-label="Smaller text"
              title="Smaller text"
              className="hover:text-ink px-2 py-1 text-xs"
            >
              A−
            </button>
            <button
              onClick={() => changeFont(10)}
              aria-label="Larger text"
              title="Larger text"
              className="hover:text-ink px-2 py-1 text-base"
            >
              A+
            </button>
          </div>
          <button
            onClick={toggleMode}
            title={
              mode === "paginated"
                ? "Switch to scroll mode"
                : "Switch to page mode"
            }
            className="border-line text-ink-soft hover:bg-surface rounded-full border px-3 py-1 text-sm"
          >
            {mode === "paginated" ? "📜 Scroll" : "📖 Pages"}
          </button>
          <AmbientMusic />
          <ThemePicker />
          <button
            onClick={share}
            className="border-line text-ink-soft hover:bg-surface rounded-full border px-3 py-1 text-sm"
          >
            {copied ? "Link copied!" : "Share"}
          </button>
          {/* Toggle the notes panel (sheet on mobile, side column on desktop). */}
          <button
            onClick={() => setPanelOpen((o) => !o)}
            aria-label="Notes"
            className="border-line text-ink-soft hover:bg-surface shrink-0 rounded-full border px-3 py-1 text-sm"
          >
            🗒 {annotations.length}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="relative flex min-w-0 flex-1 items-stretch">
          <button
            onClick={goPrev}
            aria-label="Previous page"
            className="text-ink-soft/50 hover:text-ink shrink-0 px-2 text-2xl sm:px-3"
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
            className="text-ink-soft/50 hover:text-ink shrink-0 px-2 text-2xl sm:px-3"
          >
            ›
          </button>
        </div>

        <aside
          className={`${panelOpen ? "flex" : "hidden"} border-line bg-surface fixed inset-x-0 bottom-0 z-20 max-h-[65%] flex-col rounded-t-2xl border-t shadow-2xl sm:static sm:max-h-none sm:w-80 sm:shrink-0 sm:rounded-none sm:border-t-0 sm:border-l sm:shadow-none`}
        >
          {/* Mobile-only sheet handle / close */}
          <button
            onClick={() => setPanelOpen(false)}
            className="text-ink-soft mx-auto mt-2 mb-1 flex items-center gap-1 rounded-full px-3 py-1 text-xs sm:hidden"
          >
            ▾ Close notes
          </button>
          {pending && (
            <div className="border-line border-b p-4">
              <p className="border-accent text-ink-soft mb-2 border-l-2 pl-2 text-sm italic">
                “{pending.text}”
              </p>
              <textarea
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add a note in the margin…"
                className="border-line text-ink focus:border-accent h-20 w-full resize-none rounded-md border bg-transparent p-2 text-sm outline-none"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setPending(null);
                    setDraft("");
                  }}
                  className="text-ink-soft hover:text-ink rounded-md px-3 py-1.5 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={saveComment}
                  className="bg-accent text-accent-ink rounded-full px-3 py-1.5 text-sm font-medium hover:opacity-90"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {annotations.length === 0 && !pending ? (
              <p className="text-ink-soft text-sm">
                Select any passage to highlight it and add a note. Notes are
                shared with everyone reading this book.
              </p>
            ) : (
              <ul className="space-y-3">
                {annotations.map((a) => (
                  <li
                    key={a.id}
                    className="group border-line bg-bg/40 rounded-lg border p-3"
                  >
                    <button
                      onClick={() => jumpTo(a.cfiRange)}
                      className="w-full text-left"
                    >
                      <p
                        className={`text-ink-soft border-l-2 pl-2 text-sm ${
                          a.mine ? "border-accent" : "border-blue-400"
                        }`}
                      >
                        “{a.text}”
                      </p>
                      {a.comment && (
                        <p className="text-ink mt-2 text-sm">{a.comment}</p>
                      )}
                    </button>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-ink-soft text-xs">
                        {a.mine ? "You" : a.authorName}
                      </span>
                      {a.mine && (
                        <button
                          onClick={() => removeAnnotation(a)}
                          aria-label="Delete note"
                          title="Delete note"
                          className="text-ink-soft text-base transition-colors hover:text-red-500"
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

      {progress && (
        <footer className="border-line flex items-center gap-3 border-t px-4 py-2">
          <input
            type="range"
            min={1}
            max={progress.total}
            value={progress.cur}
            onChange={(e) => goToPage(Number(e.target.value))}
            aria-label="Jump to page"
            className="h-1 flex-1 cursor-pointer accent-[var(--accent)]"
          />
          <span className="text-ink-soft text-xs whitespace-nowrap">
            page {progress.cur} of {progress.total}
          </span>
        </footer>
      )}
    </div>
  );
}
