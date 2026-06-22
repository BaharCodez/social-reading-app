"use client";

import { useRef } from "react";
import SignedInBar from "./SignedInBar";
import { useFileDrop } from "@/app/lib/useFileDrop";
import PixelPlant from "./PixelPlant";
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

// How many books sit on one shelf before starting the next.
const PER_SHELF = 5;

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

  const shelves: BookMeta[][] = [];
  for (let i = 0; i < books.length; i += PER_SHELF) {
    shelves.push(books.slice(i, i + PER_SHELF));
  }

  return (
    <div className="flex flex-1 flex-col" {...dropHandlers}>
      <SignedInBar userName={userName} />

      {dragging && (
        <div className="bg-accent/15 text-ink pointer-events-none fixed inset-0 z-10 flex items-center justify-center text-lg font-medium backdrop-blur-[1px]">
          Drop to add to your shelf
        </div>
      )}

      <div className="mx-auto w-full max-w-5xl flex-1 px-6 pb-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-ink font-serif text-4xl font-semibold tracking-tight">
              my bookshelf
            </h1>
            <p className="text-ink-soft mt-1 text-sm">
              {books.length} book{books.length === 1 ? "" : "s"} · shared with
              everyone
            </p>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="bg-accent text-accent-ink rounded-full px-4 py-2 text-sm font-medium shadow-sm transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Adding…" : "+ Add book"}
          </button>
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="space-y-10">
          {shelves.map((shelf, shelfIndex) => (
            <section key={shelfIndex}>
              <div className="touch-scroll flex items-end gap-5 overflow-x-auto px-1 pb-3">
                {shelf.map((book) => (
                  <BookSpine
                    key={book.id}
                    book={book}
                    onOpen={onOpen}
                    onDelete={onDelete}
                  />
                ))}
                {/* pixel plants — only shown in the Plant Shop theme (CSS) */}
                <div className="shelf-plant shrink-0 items-end gap-1 select-none">
                  <PixelPlant variant={shelfIndex} className="h-12 w-9" />
                  <PixelPlant variant={shelfIndex + 2} className="h-10 w-8" />
                  <PixelPlant variant={shelfIndex + 1} className="h-11 w-8" />
                </div>
              </div>
              {/* wooden shelf ledge */}
              <div
                className="h-3 rounded-[3px]"
                style={{
                  background:
                    "linear-gradient(180deg, var(--shelf), var(--shelf-edge))",
                  boxShadow: "0 12px 18px -10px rgba(0,0,0,0.5)",
                }}
              />
            </section>
          ))}
        </div>
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
  );
}

function BookSpine({
  book,
  onOpen,
  onDelete,
}: {
  book: BookMeta;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex w-28 shrink-0 flex-col sm:w-32">
      <button
        type="button"
        onClick={() => onOpen(book.id)}
        className="group block"
      >
        <div className="relative aspect-2/3 w-full overflow-hidden rounded-md ring-1 ring-black/10 transition-transform duration-200 group-hover:-translate-y-1.5 group-hover:shadow-xl">
          <div
            className="absolute inset-0"
            style={{ boxShadow: "0 10px 16px -8px rgba(0,0,0,0.55)" }}
          />
          {book.coverDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.coverDataUrl}
              alt={book.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="bg-surface text-ink flex h-full w-full items-center justify-center p-3 text-center font-serif text-sm font-medium">
              {book.title}
            </span>
          )}
          {book.noteCount > 0 && (
            <span className="bg-accent text-accent-ink absolute top-1.5 right-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium shadow">
              {book.noteCount}
            </span>
          )}
        </div>
      </button>
      <p className="text-ink mt-2 truncate text-center font-serif text-sm font-medium">
        {book.title}
      </p>
      <p className="text-ink-soft truncate text-center text-xs">
        {book.author}
      </p>
      <div className="text-ink-soft mt-0.5 flex items-center justify-center gap-2 text-[11px]">
        <span className="truncate">{book.mine ? "you" : book.ownerName}</span>
        {book.mine && (
          <button
            type="button"
            onClick={() => onDelete(book.id)}
            aria-label={`Remove ${book.title}`}
            title={`Remove ${book.title}`}
            className="transition-colors hover:text-red-500"
          >
            🗑
          </button>
        )}
      </div>
    </div>
  );
}
