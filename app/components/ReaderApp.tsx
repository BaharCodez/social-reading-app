"use client";

import { useCallback, useEffect, useState } from "react";
import UploadDropzone from "./UploadDropzone";
import Library from "./Library";
import Reader from "./Reader";
import {
  deleteBook,
  getAllBookMeta,
  getBook,
  parseBookMetadata,
  saveBook,
  type LibraryBook,
  type LibraryBookMeta,
} from "@/app/lib/library";

export default function ReaderApp() {
  const [books, setBooks] = useState<LibraryBookMeta[] | null>(null);
  const [open, setOpen] = useState<LibraryBook | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the saved library on first paint.
  useEffect(() => {
    getAllBookMeta()
      .then(setBooks)
      .catch(() => setBooks([]));
  }, []);

  const refresh = useCallback(async () => {
    setBooks(await getAllBookMeta());
  }, []);

  const addBook = useCallback(
    async (data: ArrayBuffer, fileName: string) => {
      if (!fileName.toLowerCase().endsWith(".epub")) {
        setError("That doesn't look like an EPUB file. Please choose a .epub.");
        return;
      }
      setError(null);
      setBusy(true);
      try {
        const meta = await parseBookMetadata(data);
        const book: LibraryBook = {
          id: crypto.randomUUID(),
          title: meta.title,
          author: meta.author,
          coverDataUrl: meta.coverDataUrl,
          data,
          addedAt: Date.now(),
        };
        await saveBook(book);
        await refresh();
        setOpen(book);
      } catch (e) {
        setError("Couldn't read this EPUB. It may be corrupted.");
        console.error(e);
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  const openBook = useCallback(async (id: string) => {
    const book = await getBook(id);
    if (book) setOpen(book);
  }, []);

  const removeBook = useCallback(
    async (id: string) => {
      await deleteBook(id);
      await refresh();
    },
    [refresh],
  );

  if (open) {
    return (
      <Reader
        bookData={open.data}
        bookId={open.id}
        title={open.title}
        onClose={() => setOpen(null)}
      />
    );
  }

  // Still loading the library index.
  if (books === null) {
    return (
      <p className="flex flex-1 items-center justify-center text-sm text-zinc-400">
        Loading your library…
      </p>
    );
  }

  // Empty library → the inviting first-run upload screen.
  if (books.length === 0) {
    return <UploadDropzone busy={busy} error={error} onFile={addBook} />;
  }

  return (
    <Library
      books={books}
      busy={busy}
      error={error}
      onFile={addBook}
      onOpen={openBook}
      onDelete={removeBook}
    />
  );
}
