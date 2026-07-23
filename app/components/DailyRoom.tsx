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

const BOARD_DAYS = 56; // 8 weeks of little squares

/* Local calendar date — streaks follow the visitor's clock, not the server's. */
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
  serverDay,
}: {
  article: Article | null;
  scene: SpanishScene;
  listening: SpanishLine;
  ticks: Tick[];
  serverDay: string;
}) {
  const [ticks, setTicks] = useState(initialTicks);
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

  /* Consecutive days ending today — or yesterday, if today isn't done yet. */
  function streak(kind: string) {
    let count = 0;
    let offset = done.has(`${kind}:${today}`) ? 0 : 1;
    while (done.has(`${kind}:${localDay(offset)}`)) {
      count++;
      offset++;
    }
    return count;
  }

  const articleDone = done.has(`article:${today}`);
  const spanishDone = done.has(`spanish:${today}`);
  const listeningDone = done.has(`listening:${today}`);
  const articleStreak = streak("article");
  const spanishStreak = streak("spanish");
  const listeningStreak = streak("listening");

  const board = Array.from({ length: BOARD_DAYS }, (_, i) => {
    const day = localDay(BOARD_DAYS - 1 - i);
    const count = ["article", "spanish", "listening"].filter((k) =>
      done.has(`${k}:${day}`),
    ).length;
    return { day, count };
  });

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
            <button
              type="button"
              onClick={() => tick("article")}
              disabled={articleDone || busy === "article"}
              className={`font-pixel mt-4 rounded-full px-4 py-2 text-sm transition-opacity ${
                articleDone
                  ? "bg-accent/30 text-ink cursor-default"
                  : "bg-accent text-accent-ink hover:opacity-90"
              }`}
            >
              {articleDone ? "read ✓" : busy === "article" ? "…" : "I read it"}
            </button>
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

      {/* the streak board */}
      <section className="pixel-frame bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-pixel text-ink-soft text-xs tracking-wider uppercase">
            the streak board
          </h2>
          <p className="text-ink-soft font-mono text-xs">
            📖 {articleStreak}d · 🗣️ {spanishStreak}d · 👂 {listeningStreak}d
          </p>
        </div>
        <div className="mt-4 grid grid-flow-col grid-rows-7 justify-start gap-1">
          {board.map(({ day, count }) => (
            <div
              key={day}
              title={day}
              className={`h-3.5 w-3.5 ${
                count === 3
                  ? "bg-accent"
                  : count === 2
                    ? "bg-accent/60"
                    : count === 1
                      ? "bg-accent-2"
                      : "bg-ink/10"
              } ${day === today ? "ring-ink/40 ring-2" : ""}`}
            />
          ))}
        </div>
        <p className="text-ink-soft mt-3 font-mono text-[10px]">
          ░ nothing · <span className="text-accent-2">▒</span> one ·{" "}
          <span className="text-accent/60">▓</span> two ·{" "}
          <span className="text-accent">█</span> all three — eight weeks of
          showing up
        </p>
      </section>
    </div>
  );
}
