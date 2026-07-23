"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { marked } from "marked";

interface PostDraft {
  id?: string;
  title: string;
  content: string;
  published: boolean;
}

/* A calm markdown editor: big title, a toolbar that inserts markdown around
   your selection, image upload straight into the text, and a live preview
   rendered exactly like the published article. */
export default function PostEditor({
  initial,
}: {
  initial?: PostDraft & { id: string };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [showPreview, setShowPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  /* Wrap the current selection (or drop in a placeholder) and refocus. */
  function wrap(before: string, after = "", placeholder = "text") {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    const selected = value.slice(a, b) || placeholder;
    const next = value.slice(0, a) + before + selected + after + value.slice(b);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(
        a + before.length,
        a + before.length + selected.length,
      );
    });
  }

  /* Insert a block (heading, quote, divider) at the start of a fresh line. */
  function block(prefix: string) {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: a, value } = el;
    const atLineStart = a === 0 || value[a - 1] === "\n";
    const insert = (atLineStart ? "" : "\n\n") + prefix;
    const next = value.slice(0, a) + insert + value.slice(a);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + insert.length, a + insert.length);
    });
  }

  async function addImage(file: File) {
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/images", { method: "POST", body: form });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't upload that image.");
      return;
    }
    const { url } = (await res.json()) as { url: string };
    block(`![](${url})\n\n`);
  }

  async function save(published: boolean) {
    if (!title.trim()) {
      setError("Give it a title first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        initial ? `/api/posts/${initial.id}` : "/api/posts",
        {
          method: initial ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content, published }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't save.");
        return;
      }
      const { id } = (await res.json()) as { id: string };
      router.push(published ? `/notes/${id ?? initial?.id}` : "/notes");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!initial || !window.confirm("Tear this page out for good?")) return;
    await fetch(`/api/posts/${initial.id}`, { method: "DELETE" });
    router.push("/notes");
    router.refresh();
  }

  const tool =
    "border-line text-ink-soft hover:text-ink hover:border-accent rounded border-2 px-2 py-0.5 font-mono text-xs transition-colors";

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 sm:px-6">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title…"
        autoFocus={!initial}
        className="text-ink placeholder:text-ink-soft/50 w-full bg-transparent font-serif text-4xl font-bold tracking-tight outline-none"
      />

      {/* toolbar */}
      <div className="border-line mt-4 flex flex-wrap items-center gap-2 border-y-2 py-2">
        <button type="button" className={tool} onClick={() => block("## ")}>
          H2
        </button>
        <button
          type="button"
          className={`${tool} font-bold`}
          onClick={() => wrap("**", "**")}
        >
          B
        </button>
        <button
          type="button"
          className={`${tool} italic`}
          onClick={() => wrap("*", "*")}
        >
          I
        </button>
        <button type="button" className={tool} onClick={() => block("> ")}>
          &quot;
        </button>
        <button type="button" className={tool} onClick={() => block("- ")}>
          list
        </button>
        <button
          type="button"
          className={tool}
          onClick={() => wrap("[", "](https://)", "link text")}
        >
          link
        </button>
        <button type="button" className={tool} onClick={() => block("---\n\n")}>
          ⁂
        </button>
        <button
          type="button"
          className={tool}
          onClick={() => imageRef.current?.click()}
        >
          + image
        </button>
        <button
          type="button"
          onClick={() => setShowPreview((p) => !p)}
          className={`${tool} ml-auto ${showPreview ? "text-accent border-accent" : ""}`}
        >
          {showPreview ? "✎ write" : "👁 preview"}
        </button>
      </div>

      {showPreview ? (
        <div
          className="article min-h-[50vh] py-4"
          dangerouslySetInnerHTML={{
            __html: marked.parse(content, { async: false, breaks: true }),
          }}
        />
      ) : (
        <textarea
          ref={bodyRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write about what you're reading, building, wondering…"
          className="text-ink placeholder:text-ink-soft/50 min-h-[50vh] w-full resize-y bg-transparent py-4 text-base leading-relaxed outline-none"
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="border-line flex items-center gap-3 border-t-2 pt-4">
        <button
          type="button"
          disabled={busy}
          onClick={() => save(true)}
          className="bg-accent text-accent-ink font-pixel rounded-full px-5 py-2 text-sm hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "saving…" : "publish"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => save(false)}
          className="border-line text-ink-soft hover:text-ink font-pixel rounded-full border-2 px-4 py-2 text-sm"
        >
          save draft
        </button>
        {initial && (
          <button
            type="button"
            onClick={remove}
            className="text-ink-soft ml-auto text-sm hover:text-red-500"
          >
            tear it out
          </button>
        )}
      </div>

      <input
        ref={imageRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void addImage(file);
        }}
      />
    </div>
  );
}
