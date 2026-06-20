"use client";

import { useEffect, useState } from "react";

// Light/dark toggle. Defaults to the OS theme until the user picks one, then
// remembers the choice in localStorage (applied pre-paint by a script in the
// root layout, so there's no flash).
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  // Sync the icon with the class the pre-paint script applied. Deferred so it
  // doesn't run synchronously in the effect (and can't cause a hydration clash).
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      setDark(document.documentElement.classList.contains("dark")),
    );
    return () => cancelAnimationFrame(id);
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.style.colorScheme = next ? "dark" : "light";
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="rounded-md px-2 py-1 text-base text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
