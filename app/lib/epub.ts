// Client-side EPUB metadata extraction, used before uploading a book so the
// library grid has a title/author/cover to show.

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
