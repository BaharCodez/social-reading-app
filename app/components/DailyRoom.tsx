"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { SpanishLine, SpanishScene } from "@/app/lib/spanish";

// Mirror of the server-side DailyArticle shape (feeds.ts is server-only).
interface Article {
  source: string;
  title: string;
  url: string;
}

interface Tick {
  kind: string;
  day: string;
}

interface Bookmark {
  id: string;
  url: string;
  title: string;
  source: string;
  favorite: boolean;
}

/* Local calendar date — follows the visitor's clock, not the server's. */
function localDay(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/* The default Spanish voice is often the muffled "compact" one — rank the
   installed voices and take the clearest on offer. */
function pickSpanishVoice() {
  const voices = window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith("es"));
  const score = (v: SpeechSynthesisVoice) =>
    (/google/i.test(v.name) ? 4 : 0) +
    (/enhanced|premium|natural/i.test(v.name) ? 3 : 0) +
    (/m[oó]nica|paulina/i.test(v.name) ? 2 : 0) +
    (/^es-(ES|MX|US)$/i.test(v.lang) ? 1 : 0);
  return voices.sort((a, b) => score(b) - score(a))[0] ?? null;
}

/* Read a line aloud with the browser's built-in Spanish voice. */
function speakSpanish(text: string, rate: number) {
  const synth = window.speechSynthesis;
  synth.cancel();
  const speakNow = () => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-ES";
    u.rate = rate;
    const voice = pickSpanishVoice();
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    }
    synth.speak(u);
  };
  // The voice list loads async — first click can land before it's ready.
  if (synth.getVoices().length === 0) {
    let spoken = false;
    const go = () => {
      if (!spoken) {
        spoken = true;
        speakNow();
      }
    };
    synth.addEventListener("voiceschanged", go, { once: true });
    setTimeout(go, 300);
  } else {
    speakNow();
  }
}

export default function DailyRoom({
  article,
  scene,
  listening,
  ticks: initialTicks,
  bookmarks: initialBookmarks,
  serverDay,
}: {
  article: Article | null;
  scene: SpanishScene;
  listening: SpanishLine;
  ticks: Tick[];
  bookmarks: Bookmark[];
  serverDay: string;
}) {
  const [ticks, setTicks] = useState(initialTicks);
  const [shelf, setShelf] = useState(initialBookmarks);
  const [savingArticle, setSavingArticle] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // SSR says no (there's no window); the real answer arrives on hydration.
  const canSpeak = useSyncExternalStore(
    () => () => {},
    () => "speechSynthesis" in window,
    () => false,
  );

  // SSR renders with the server's date; the visitor's clock takes over on
  // hydration (string snapshots compare by value, so this stays stable).
  const today = useSyncExternalStore(
    () => () => {},
    () => localDay(),
    () => serverDay,
  );

  const done = useMemo(
    () => new Set(ticks.map((t) => `${t.kind}:${t.day}`)),
    [ticks],
  );

  async function tick(kind: "article" | "spanish" | "listening") {
    if (done.has(`${kind}:${today}`) || busy) return;
    setBusy(kind);
    try {
      const res = await fetch("/api/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, day: today }),
      });
      if (res.ok) setTicks((t) => [...t, { kind, day: today }]);
    } finally {
      setBusy(null);
    }
  }

  // The shelf, split into the special pile (starred) and the rest.
  const shelved = useMemo(
    () => new Set(shelf.map((b) => b.url)),
    [shelf],
  );
  const pile = shelf.filter((b) => b.favorite);
  const rest = shelf.filter((b) => !b.favorite);

  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkErr, setLinkErr] = useState<string | null>(null);
  const [addingLink, setAddingLink] = useState(false);
  // Surfaced when a shelf write bounces (usually: not signed in as owner).
  const [shelfNote, setShelfNote] = useState<string | null>(null);

  // Add a bookmark; on success prepend it to the shelf. Returns ok/reason.
  async function saveBookmark(input: {
    url: string;
    title: string;
    source?: string;
  }) {
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false as const, error: data.error ?? "Couldn't save that." };
    }
    const saved: Bookmark = await res.json();
    setShelf((s) => (s.some((b) => b.id === saved.id) ? s : [saved, ...s]));
    return { ok: true as const };
  }

  async function saveArticle() {
    if (!article || savingArticle || shelved.has(article.url)) return;
    setSavingArticle(true);
    setShelfNote(null);
    try {
      const result = await saveBookmark({
        url: article.url,
        title: article.title,
        source: article.source,
      });
      if (!result.ok) setShelfNote(result.error);
    } finally {
      setSavingArticle(false);
    }
  }

  async function addLink(e: React.FormEvent) {
    e.preventDefault();
    if (addingLink) return;
    setLinkErr(null);
    setAddingLink(true);
    try {
      const result = await saveBookmark({
        url: linkUrl.trim(),
        title: linkTitle.trim() || linkUrl.trim(),
      });
      if (result.ok) {
        setLinkUrl("");
        setLinkTitle("");
      } else {
        setLinkErr(result.error);
      }
    } finally {
      setAddingLink(false);
    }
  }

  async function toggleFavorite(b: Bookmark) {
    const next = !b.favorite;
    setShelf((s) =>
      s.map((x) => (x.id === b.id ? { ...x, favorite: next } : x)),
    );
    const res = await fetch(`/api/bookmarks/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorite: next }),
    });
    if (!res.ok) {
      // Roll back if the house said no.
      setShelf((s) =>
        s.map((x) => (x.id === b.id ? { ...x, favorite: b.favorite } : x)),
      );
      setShelfNote("Sign in as the owner to change the shelf.");
    }
  }

  async function removeBookmark(b: Bookmark) {
    const prev = shelf;
    setShelf((s) => s.filter((x) => x.id !== b.id));
    const res = await fetch(`/api/bookmarks/${b.id}`, { method: "DELETE" });
    if (!res.ok) {
      setShelf(prev);
      setShelfNote("Sign in as the owner to change the shelf.");
    }
  }

  function bookmarkRow(b: Bookmark) {
    return (
      <li
        key={b.id}
        className="border-line flex items-start gap-2 border-b py-2 last:border-0"
      >
        <button
          type="button"
          onClick={() => toggleFavorite(b)}
          title={b.favorite ? "in the pile" : "add to the pile"}
          className="text-accent shrink-0 pt-0.5 text-sm"
        >
          {b.favorite ? "★" : "☆"}
        </button>
        <div className="min-w-0 flex-1">
          {b.source && (
            <p className="text-accent-2 font-mono text-[10px] font-bold">
              {b.source}
            </p>
          )}
          <a
            href={b.url}
            target="_blank"
            rel="noreferrer"
            className="text-ink hover:text-accent block truncate text-sm underline-offset-4 hover:underline"
          >
            {b.title} ↗
          </a>
        </div>
        <button
          type="button"
          onClick={() => removeBookmark(b)}
          title="remove from the shelf"
          className="text-ink-soft hover:text-ink shrink-0 text-sm"
        >
          ×
        </button>
      </li>
    );
  }

  const articleDone = done.has(`article:${today}`);
  const articleSaved = article ? shelved.has(article.url) : false;
  const spanishDone = done.has(`spanish:${today}`);
  const listeningDone = done.has(`listening:${today}`);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-12 sm:px-6">
      {/* today's read */}
      <section className="pixel-frame bg-surface p-4 sm:p-5">
        <h2 className="font-pixel text-ink-soft text-xs tracking-wider uppercase">
          today&apos;s read
        </h2>
        {article ? (
          <>
            <p className="text-accent-2 mt-3 font-mono text-xs font-bold">
              {article.source}
            </p>
            <a
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="font-pixel text-ink hover:text-accent mt-1 block text-lg leading-snug underline-offset-4 hover:underline"
            >
              {article.title} ↗
            </a>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => tick("article")}
                disabled={articleDone || busy === "article"}
                className={`font-pixel rounded-full px-4 py-2 text-sm transition-opacity ${
                  articleDone
                    ? "bg-accent/30 text-ink cursor-default"
                    : "bg-accent text-accent-ink hover:opacity-90"
                }`}
              >
                {articleDone ? "read ✓" : busy === "article" ? "…" : "I read it"}
              </button>
              <button
                type="button"
                onClick={saveArticle}
                disabled={articleSaved || savingArticle}
                title={
                  articleSaved ? "already on the shelf" : "save to the shelf"
                }
                className={`font-pixel border-line rounded-full border px-4 py-2 text-sm transition-opacity ${
                  articleSaved
                    ? "text-ink-soft cursor-default"
                    : "text-ink hover:bg-ink/5"
                }`}
              >
                {articleSaved
                  ? "★ shelved"
                  : savingArticle
                    ? "…"
                    : "☆ save to shelf"}
              </button>
            </div>
          </>
        ) : (
          <p className="text-ink-soft mt-3 text-sm">
            The newsstand is empty — couldn&apos;t reach the feeds. Come back in
            a bit.
          </p>
        )}
      </section>

      {/* today's spanish */}
      <section className="pixel-frame bg-surface p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-pixel text-ink-soft text-xs tracking-wider uppercase">
            hoy: un poco de español
          </h2>
          <span className="text-ink-soft font-mono text-xs">
            scene: {scene.scene}
          </span>
        </div>

        <div className="mt-3 space-y-2">
          {scene.lines.map((line, i) => (
            <div key={i} className={i % 2 === 0 ? "" : "pl-4 sm:pl-6"}>
              <p className="text-ink text-sm font-medium">{line.es}</p>
              {showEnglish && (
                <p className="text-ink-soft text-xs">{line.en}</p>
              )}
            </div>
          ))}
        </div>

        <div className="border-accent bg-accent/10 mt-4 border-l-4 p-3">
          <p className="font-pixel text-ink-soft text-[10px] tracking-wider uppercase">
            your turn — say it out loud, once is enough
          </p>
          <p className="text-ink mt-1 text-sm font-medium">
            {scene.yourTurn.es}
          </p>
          {showEnglish && (
            <p className="text-ink-soft text-xs">{scene.yourTurn.en}</p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowEnglish((s) => !s)}
            className="font-pixel text-ink-soft hover:text-ink border-line hover:border-accent rounded border-2 border-dashed px-3 py-2 text-xs transition-colors"
          >
            {showEnglish ? "hide english" : "show english"}
          </button>
          <button
            type="button"
            onClick={() => tick("spanish")}
            disabled={spanishDone || busy === "spanish"}
            className={`font-pixel rounded-full px-4 py-2 text-sm transition-opacity ${
              spanishDone
                ? "bg-accent/30 text-ink cursor-default"
                : "bg-accent text-accent-ink hover:opacity-90"
            }`}
          >
            {spanishDone ? "hecho ✓" : busy === "spanish" ? "…" : "¡hecho!"}
          </button>
        </div>
      </section>

      {/* today's listening */}
      <section className="pixel-frame bg-surface p-4 sm:p-5">
        <h2 className="font-pixel text-ink-soft text-xs tracking-wider uppercase">
          el oído — just listen
        </h2>
        <p className="text-ink-soft mt-2 text-sm">
          One sentence, ears only. Play it a few times before you peek.
        </p>

        {canSpeak ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => speakSpanish(listening.es, 0.9)}
              className="bg-accent-2 text-accent-ink font-pixel rounded-full px-4 py-2 text-sm hover:opacity-90"
            >
              ▶ listen
            </button>
            <button
              type="button"
              onClick={() => speakSpanish(listening.es, 0.6)}
              className="font-pixel text-ink-soft hover:text-ink border-line hover:border-accent rounded border-2 border-dashed px-3 py-2 text-xs transition-colors"
            >
              🐢 slower
            </button>
          </div>
        ) : (
          <p className="text-ink-soft mt-4 font-mono text-xs">
            (this browser can&apos;t speak — reveal and read instead)
          </p>
        )}

        {revealed ? (
          <div className="border-accent-2 bg-accent-2/10 mt-4 border-l-4 p-3">
            <p className="text-ink text-sm font-medium">{listening.es}</p>
            <p className="text-ink-soft mt-1 text-xs">{listening.en}</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="font-pixel text-ink-soft hover:text-ink border-line hover:border-accent mt-4 block rounded border-2 border-dashed px-3 py-2 text-xs transition-colors"
          >
            reveal the sentence
          </button>
        )}

        <button
          type="button"
          onClick={() => tick("listening")}
          disabled={listeningDone || busy === "listening"}
          className={`font-pixel mt-4 rounded-full px-4 py-2 text-sm transition-opacity ${
            listeningDone
              ? "bg-accent/30 text-ink cursor-default"
              : "bg-accent text-accent-ink hover:opacity-90"
          }`}
        >
          {listeningDone
            ? "entendido ✓"
            : busy === "listening"
              ? "…"
              : "¡entendido!"}
        </button>
      </section>

      {/* the shelf — articles worth keeping (a running dissertation pile) */}
      <section className="pixel-frame bg-surface p-4 sm:p-5">
        <h2 className="font-pixel text-ink-soft text-xs tracking-wider uppercase">
          the shelf
        </h2>
        <p className="text-ink-soft mt-1 text-xs">
          reads worth keeping — star the best into the pile.
        </p>
        {shelfNote && (
          <p className="text-accent-2 mt-2 text-xs font-medium">{shelfNote}</p>
        )}

        <form onSubmit={addLink} className="mt-4 space-y-2">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://… a link you found"
            className="border-line text-ink focus:border-accent w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              placeholder="title (optional)"
              className="border-line text-ink focus:border-accent min-w-0 flex-1 rounded-lg border bg-transparent px-3 py-2 text-sm outline-none"
            />
            <button
              type="submit"
              disabled={addingLink || !linkUrl.trim()}
              className="font-pixel bg-accent text-accent-ink shrink-0 rounded-full px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
            >
              {addingLink ? "…" : "add"}
            </button>
          </div>
          {linkErr && (
            <p className="text-sm text-red-600 dark:text-red-400">{linkErr}</p>
          )}
        </form>

        {pile.length > 0 && (
          <div className="mt-5">
            <h3 className="font-pixel text-accent text-[11px] tracking-wider uppercase">
              ★ the pile
            </h3>
            <ul className="mt-2">{pile.map(bookmarkRow)}</ul>
          </div>
        )}

        <div className="mt-5">
          <h3 className="font-pixel text-ink-soft text-[11px] tracking-wider uppercase">
            on the shelf
          </h3>
          {rest.length > 0 ? (
            <ul className="mt-2">{rest.map(bookmarkRow)}</ul>
          ) : (
            <p className="text-ink-soft mt-2 text-sm">
              {shelf.length === 0
                ? "Nothing shelved yet — save a read above."
                : "Everything here is in the pile."}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
