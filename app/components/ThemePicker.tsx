"use client";

import { useEffect, useRef, useState } from "react";
import { THEMES, DEFAULT_THEME } from "@/app/lib/themes";

// Pick a named theme. The choice is applied pre-paint by a script in the root
// layout (so there's no flash) and remembered in localStorage.
export default function ThemePicker() {
  const [current, setCurrent] = useState(DEFAULT_THEME);
  const [open, setOpen] = useState(false);
  // The menu is positioned fixed so it isn't clipped by the scrollable bar.
  const [pos, setPos] = useState<{ top: number; right: number }>({
    top: 0,
    right: 0,
  });
  const btnRef = useRef<HTMLButtonElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setCurrent(document.documentElement.dataset.theme ?? DEFAULT_THEME);
      initialized.current = true;
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!initialized.current) return;
    document.documentElement.dataset.theme = current;
    localStorage.setItem("theme", current);
  }, [current]);

  useEffect(() => {
    if (!open) return;
    function onClick() {
      setOpen(false);
    }
    // Close on any outside interaction or scroll.
    window.addEventListener("mousedown", onClick);
    window.addEventListener("scroll", onClick, true);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("scroll", onClick, true);
    };
  }, [open]);

  function toggleOpen() {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    setOpen((o) => !o);
  }

  const active = THEMES.find((t) => t.id === current) ?? THEMES[0];

  return (
    <>
      <button
        ref={btnRef}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={toggleOpen}
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
        <div
          className="border-line bg-surface fixed z-50 w-40 overflow-hidden rounded-xl border py-1 shadow-lg"
          style={{ top: pos.top, right: pos.right }}
          onMouseDown={(e) => e.stopPropagation()}
        >
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
    </>
  );
}
