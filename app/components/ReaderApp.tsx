"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  // True once the initial book-restore has run, so the URL-sync effect doesn't
  // clear the saved book on the first render.
  const restored = useRef(false);

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
      // Reopen the book from a share link, or the last one you were reading.
      const shared =
        new URLSearchParams(window.location.search).get("book") ??
        localStorage.getItem("lastBook");
      if (shared && active) setOpenId(shared);
      restored.current = true;
    })();
    return () => {
      active = false;
    };
  }, []);

  // Keep the URL in sync so the current book is always shareable. Guarded so
  // it can't wipe the saved book before the restore above has run.
  useEffect(() => {
    if (!restored.current) return;
    const url = new URL(window.location.href);
    if (openId) {
      url.searchParams.set("book", openId);
      localStorage.setItem("lastBook", openId);
    } else {
      url.searchParams.delete("book");
      localStorage.removeItem("lastBook");
    }
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
        // Read the file once into memory; mobile (iCloud) file handles can go
        // stale between reads, so reuse these bytes for both parsing and upload.
        // Retry a few times — iOS may still be downloading an iCloud file.
        let data: ArrayBuffer | null = null;
        for (let attempt = 0; attempt < 3 && data === null; attempt++) {
          try {
            data = await file.arrayBuffer();
          } catch (err) {
            if (attempt === 2) {
              console.warn(
                "Couldn't read file into memory; uploading raw.",
                err,
              );
            } else {
              await new Promise((r) => setTimeout(r, 700));
            }
          }
        }

        // Metadata parsing is best-effort — fall back to the filename, since the
        // reader reads the real title from the book on open.
        let meta = {
          title: file.name.replace(/\.epub$/i, ""),
          author: "Unknown author",
        };
        if (data) {
          try {
            meta = await parseBookMetadata(data);
          } catch (err) {
            console.warn("Couldn't read EPUB metadata; using filename.", err);
          }
        }

        const payload = data
          ? new Blob([data], { type: "application/epub+zip" })
          : file;
        const { id } = await uploadBook(payload, meta);
        await refresh();
        setOpenId(id);
      } catch (e) {
        setError("Couldn't add this EPUB. Please try again.");
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
