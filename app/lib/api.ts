// Thin client for the reading API. All calls hit same-origin route handlers
// that authorize against the signed-in session.

import type { Annotation, AnnotationInput, BookMeta } from "./types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

// --- Books ---------------------------------------------------------------

export async function fetchBooks(): Promise<BookMeta[]> {
  return json<BookMeta[]>(await fetch("/api/books"));
}

export async function uploadBook(
  file: Blob,
  meta: { title: string; author: string; coverDataUrl?: string },
): Promise<{ id: string }> {
  const form = new FormData();
  form.append("file", file);
  form.append("title", meta.title);
  form.append("author", meta.author);
  if (meta.coverDataUrl) form.append("coverDataUrl", meta.coverDataUrl);
  return json<{ id: string }>(
    await fetch("/api/books", { method: "POST", body: form }),
  );
}

export async function deleteBook(id: string): Promise<void> {
  const res = await fetch(`/api/books/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error("Couldn't delete book.");
}

// URL the reader fetches the raw EPUB bytes from.
export function bookFileUrl(id: string): string {
  return `/api/books/${id}`;
}

// --- Annotations ---------------------------------------------------------

export async function fetchAnnotations(bookId: string): Promise<Annotation[]> {
  return json<Annotation[]>(await fetch(`/api/books/${bookId}/annotations`));
}

export async function createAnnotation(
  bookId: string,
  input: AnnotationInput,
): Promise<Annotation> {
  return json<Annotation>(
    await fetch(`/api/books/${bookId}/annotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function deleteAnnotation(id: string): Promise<void> {
  const res = await fetch(`/api/annotations/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204)
    throw new Error("Couldn't delete annotation.");
}

// --- Reading progress (per user, synced across devices) ------------------

export async function fetchProgress(bookId: string): Promise<string | null> {
  const res = await fetch(`/api/books/${bookId}/progress`);
  if (!res.ok) return null;
  const data = (await res.json()) as { cfi: string | null };
  return data.cfi;
}

export async function saveProgress(bookId: string, cfi: string): Promise<void> {
  await fetch(`/api/books/${bookId}/progress`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cfi }),
  }).catch(() => {});
}
