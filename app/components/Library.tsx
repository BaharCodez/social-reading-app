"use client";

import { useRef } from "react";
import SignedInBar from "./SignedInBar";
import { useFileDrop } from "@/app/lib/useFileDrop";
import type { BookMeta } from "@/app/lib/types";

interface LibraryProps {
  books: BookMeta[];
  busy: boolean;
  error: string | null;
  userName: string;
  onFile: (file: File) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function Library({
  books,
  busy,
  error,
  userName,
  onFile,
  onOpen,
  onDelete,
}: LibraryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { dragging, dropHandlers } = useFileDrop(onFile);

  return (
    <div className="flex flex-1 flex-col" {...dropHandlers}>
      <SignedInBar userName={userName} />
      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center bg-amber-50/70 text-lg font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Drop to add to your library
        </div>
      )}
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 pb-10">
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
                    {book.noteCount > 0 && (
                      <span className="text-amber-600">
                        {" "}
                        · {book.noteCount} note{book.noteCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-zinc-400">
                    Added by {book.mine ? "you" : book.ownerName}
                  </p>
                </div>
                {book.mine && (
                  <button
                    type="button"
                    onClick={() => onDelete(book.id)}
                    aria-label={`Remove ${book.title}`}
                    className="shrink-0 text-xs text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".epub,application/epub+zip"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = ""; // allow re-picking the same file
            if (file) onFile(file);
          }}
        />
      </div>
    </div>
  );
}
