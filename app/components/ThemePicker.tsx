"use client";

import { useEffect, useRef, useState } from "react";
import { THEMES, DEFAULT_THEME } from "@/app/lib/themes";

// Pick a named theme. The choice is applied pre-paint by a script in the root
// layout (so there's no flash) and remembered in localStorage.
export default function ThemePicker() {
  const [current, setCurrent] = useState(DEFAULT_THEME);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // Read the theme the pre-paint script applied (deferred to avoid a clash).
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setCurrent(document.documentElement.dataset.theme ?? DEFAULT_THEME);
      initialized.current = true;
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Sync the DOM + storage from state. Skipped until we've read the initial
  // value, so it never overwrites the pre-paint theme on first load.
  useEffect(() => {
    if (!initialized.current) return;
    document.documentElement.dataset.theme = current;
    localStorage.setItem("theme", current);
  }, [current]);

  // Close the menu on outside click.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  const active = THEMES.find((t) => t.id === current) ?? THEMES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Change theme"
        title="Change theme"
        className="border-line text-ink-soft hover:bg-surface flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm"
      >
        <span
          className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10"
          style={{ background: active.swatch }}
        />
        🌿
      </button>

      {open && (
        <div className="border-line bg-surface absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border py-1 shadow-lg">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setCurrent(t.id);
                setOpen(false);
              }}
              className={`hover:bg-bg flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                t.id === current ? "text-ink" : "text-ink-soft"
              }`}
            >
              <span
                className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10"
                style={{ background: t.swatch }}
              />
              {t.label}
              {t.id === current && <span className="ml-auto">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
