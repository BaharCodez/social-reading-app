"use client";

import { useCallback, useEffect, useState } from "react";
import UploadDropzone from "./UploadDropzone";
import Library from "./Library";
import Reader from "./Reader";
import { deleteBook, fetchBooks, uploadBook } from "@/app/lib/api";
import { parseBookMetadata } from "@/app/lib/epub";
import type { BookMeta, CurrentUser } from "@/app/lib/types";

export default function ReaderApp({
  currentUser,
}: {
  currentUser: CurrentUser;
}) {
  const [books, setBooks] = useState<BookMeta[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setBooks(await fetchBooks());
  }, []);

  // Load the library and honor a ?book=<id> share link on first paint.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await fetchBooks();
        if (active) setBooks(list);
      } catch {
        if (active) setBooks([]);
      }
      const shared = new URLSearchParams(window.location.search).get("book");
      if (shared && active) setOpenId(shared);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Keep the URL in sync so the current book is always shareable.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (openId) url.searchParams.set("book", openId);
    else url.searchParams.delete("book");
    window.history.replaceState(null, "", url);
  }, [openId]);

  const addBook = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".epub")) {
        setError("That doesn't look like an EPUB file. Please choose a .epub.");
        return;
      }
      setError(null);
      setBusy(true);
      try {
        const data = await file.arrayBuffer();
        const meta = await parseBookMetadata(data);
        const { id } = await uploadBook(file, meta);
        await refresh();
        setOpenId(id);
      } catch (e) {
        setError("Couldn't add this EPUB. It may be corrupted.");
        console.error(e);
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  const removeBook = useCallback(
    async (id: string) => {
      await deleteBook(id);
      await refresh();
    },
    [refresh],
  );

  if (openId) {
    return <Reader bookId={openId} onClose={() => setOpenId(null)} />;
  }

  if (books === null) {
    return (
      <p className="flex flex-1 items-center justify-center text-sm text-zinc-400">
        Loading your library…
      </p>
    );
  }

  if (books.length === 0) {
    return (
      <UploadDropzone
        busy={busy}
        error={error}
        userName={currentUser.name}
        onFile={addBook}
      />
    );
  }

  return (
    <Library
      books={books}
      busy={busy}
      error={error}
      userName={currentUser.name}
      onFile={addBook}
      onOpen={setOpenId}
      onDelete={removeBook}
    />
  );
}
