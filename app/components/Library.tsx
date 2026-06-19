"use client";

import { useRef } from "react";
import type { LibraryBookMeta } from "@/app/lib/library";

interface LibraryProps {
  books: LibraryBookMeta[];
  busy: boolean;
  error: string | null;
  onFile: (data: ArrayBuffer, fileName: string) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function Library({
  books,
  busy,
  error,
  onFile,
  onOpen,
  onDelete,
}: LibraryProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const data = await file.arrayBuffer();
    onFile(data, file.name);
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="mb-8 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Your library
        </h1>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="rounded-md bg-amber-400 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-amber-300 disabled:opacity-50"
        >
          {busy ? "Adding…" : "+ Add book"}
        </button>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
        {books.map((book) => (
          <div key={book.id} className="group flex flex-col">
            <button
              type="button"
              onClick={() => onOpen(book.id)}
              className="relative aspect-2/3 w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-800"
            >
              {book.coverDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.coverDataUrl}
                  alt={book.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center p-4 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {book.title}
                </span>
              )}
            </button>
            <div className="mt-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                  {book.title}
                </p>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {book.author}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onDelete(book.id)}
                aria-label={`Remove ${book.title}`}
                className="shrink-0 text-xs text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".epub,application/epub+zip"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
