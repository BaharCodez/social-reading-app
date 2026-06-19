// Local-first persistence for the reading library.
//
// EPUB files are several MB, which is too large for localStorage, so we use
// IndexedDB. Two stores: one for books (metadata + the raw file), one for
// annotations (indexed by book).

import type { Annotation } from "./types";

const DB_NAME = "social-reading";
const DB_VERSION = 1;
const BOOKS_STORE = "books";
const ANNOTATIONS_STORE = "annotations";

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  coverDataUrl?: string;
  data: ArrayBuffer;
  addedAt: number;
}

// What we keep in the books grid — everything except the heavy file blob.
export type LibraryBookMeta = Omit<LibraryBook, "data">;

export type StoredAnnotation = Annotation & { bookId: string };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(BOOKS_STORE)) {
        db.createObjectStore(BOOKS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(ANNOTATIONS_STORE)) {
        const store = db.createObjectStore(ANNOTATIONS_STORE, {
          keyPath: "id",
        });
        store.createIndex("bookId", "bookId", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const request = run(transaction.objectStore(storeName));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => db.close();
      }),
  );
}

// --- Books ---------------------------------------------------------------

export async function saveBook(book: LibraryBook): Promise<void> {
  await tx(BOOKS_STORE, "readwrite", (s) => s.put(book));
}

export async function getBook(id: string): Promise<LibraryBook | undefined> {
  return tx<LibraryBook | undefined>(BOOKS_STORE, "readonly", (s) => s.get(id));
}

export async function getAllBookMeta(): Promise<LibraryBookMeta[]> {
  const books = await tx<LibraryBook[]>(BOOKS_STORE, "readonly", (s) =>
    s.getAll(),
  );
  return books
    .map(({ data: _data, ...meta }) => meta)
    .sort((a, b) => b.addedAt - a.addedAt);
}

export async function deleteBook(id: string): Promise<void> {
  await tx(BOOKS_STORE, "readwrite", (s) => s.delete(id));
  const anns = await getAnnotations(id);
  await Promise.all(anns.map((a) => deleteAnnotation(a.id)));
}

// --- Annotations ---------------------------------------------------------

export async function getAnnotations(
  bookId: string,
): Promise<StoredAnnotation[]> {
  const all = await openDb().then(
    (db) =>
      new Promise<StoredAnnotation[]>((resolve, reject) => {
        const transaction = db.transaction(ANNOTATIONS_STORE, "readonly");
        const index = transaction
          .objectStore(ANNOTATIONS_STORE)
          .index("bookId");
        const request = index.getAll(bookId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => db.close();
      }),
  );
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

export async function saveAnnotation(ann: StoredAnnotation): Promise<void> {
  await tx(ANNOTATIONS_STORE, "readwrite", (s) => s.put(ann));
}

export async function deleteAnnotation(id: string): Promise<void> {
  await tx(ANNOTATIONS_STORE, "readwrite", (s) => s.delete(id));
}

// --- EPUB metadata extraction -------------------------------------------

// Pull title/author/cover out of an EPUB so the library grid has something
// to show. Falls back gracefully if any field is missing.
export async function parseBookMetadata(data: ArrayBuffer): Promise<{
  title: string;
  author: string;
  coverDataUrl?: string;
}> {
  const ePub = (await import("epubjs")).default;
  // epub.js consumes the buffer, so hand it a copy and keep the original.
  const book = ePub(data.slice(0));
  try {
    await book.ready;
    const meta = await book.loaded.metadata;
    let coverDataUrl: string | undefined;
    try {
      const url = await book.coverUrl();
      if (url) {
        const blob = await fetch(url).then((r) => r.blob());
        coverDataUrl = await blobToDataUrl(blob);
      }
    } catch {
      /* no cover — fine */
    }
    return {
      title: meta?.title?.trim() || "Untitled",
      author: meta?.creator?.trim() || "Unknown author",
      coverDataUrl,
    };
  } finally {
    book.destroy();
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
