// Shared client/server shapes for the reading app.

export interface CurrentUser {
  id: string;
  name: string;
}

// A book as shown in the library grid (no file blob).
export interface BookMeta {
  id: string;
  title: string;
  author: string;
  coverDataUrl?: string | null;
  createdAt: number;
  noteCount: number;
}

// A margin note as returned by the API — carries who wrote it.
export interface Annotation {
  id: string;
  cfiRange: string;
  text: string;
  comment: string;
  createdAt: number;
  authorId: string;
  authorName: string;
  authorImage?: string | null;
  // True when the signed-in user wrote it (so the UI can offer delete).
  mine: boolean;
}

export interface AnnotationInput {
  cfiRange: string;
  text: string;
  comment: string;
}
