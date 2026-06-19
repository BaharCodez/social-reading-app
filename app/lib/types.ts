// A note written "in the margin" — a highlighted passage plus an optional comment.
export interface Annotation {
  id: string;
  // EPUB CFI range identifying the exact highlighted passage.
  cfiRange: string;
  // The highlighted text itself, kept so we can show it in the margin list.
  text: string;
  comment: string;
  createdAt: number;
}
