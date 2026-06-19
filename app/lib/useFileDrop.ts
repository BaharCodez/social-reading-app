"use client";

import { useEffect, useState } from "react";

// Shared drag-and-drop behavior for the upload screen and the library.
// Returns a `dragging` flag plus handlers to spread onto a drop-target element.
export function useFileDrop(onFile: (file: File) => void) {
  const [dragging, setDragging] = useState(false);

  // Stop the browser from opening a file dropped outside the target.
  useEffect(() => {
    const prevent = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);
    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", prevent);
    };
  }, []);

  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: (e: React.DragEvent) => {
      // Ignore drag-leave bubbling up from children.
      if (e.currentTarget.contains(e.relatedTarget as Node)) return;
      setDragging(false);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
  };

  return { dragging, dropHandlers };
}
