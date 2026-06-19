"use client";

import { useRef, useState } from "react";

interface UploadDropzoneProps {
  busy?: boolean;
  error?: string | null;
  onFile: (data: ArrayBuffer, fileName: string) => void;
}

export default function UploadDropzone({
  busy = false,
  error = null,
  onFile,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const data = await file.arrayBuffer();
    onFile(data, file.name);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Open a book
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Upload an EPUB to start reading. Nothing leaves your browser.
        </p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFile(e.dataTransfer.files[0]);
          }}
          className={`mt-8 flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-16 transition-colors ${
            dragging
              ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20"
              : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
          }`}
        >
          <span className="text-base font-medium text-zinc-700 dark:text-zinc-200">
            {busy ? "Adding book…" : "Drop an EPUB here"}
          </span>
          <span className="text-sm text-zinc-400">or click to browse</span>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept=".epub,application/epub+zip"
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />

        {error && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}
