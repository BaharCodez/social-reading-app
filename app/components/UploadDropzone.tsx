"use client";

import { useRef } from "react";
import SignedInBar from "./SignedInBar";
import { useFileDrop } from "@/app/lib/useFileDrop";

interface UploadDropzoneProps {
  busy?: boolean;
  error?: string | null;
  userName: string;
  onFile: (file: File) => void;
}

export default function UploadDropzone({
  busy = false,
  error = null,
  userName,
  onFile,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { dragging, dropHandlers } = useFileDrop(onFile);

  // The whole area below the top bar is a drop target, so an imprecise drop
  // still lands.
  return (
    <div className="flex flex-1 flex-col" {...dropHandlers}>
      <SignedInBar userName={userName} />
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Open a book
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Upload an EPUB to start reading. Share it and read together.
          </p>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`mt-8 flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-16 transition-colors ${
              dragging
                ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20"
                : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
            }`}
          >
            <span className="text-base font-medium text-zinc-700 dark:text-zinc-200">
              {busy
                ? "Adding book…"
                : dragging
                  ? "Drop to add"
                  : "Drop an EPUB here"}
            </span>
            <span className="text-sm text-zinc-400">or click to browse</span>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept=".epub,application/epub+zip"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = ""; // allow re-picking the same file
              if (file) onFile(file);
            }}
          />

          {error && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
