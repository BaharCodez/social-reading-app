import Link from "next/link";
import ThemePicker from "./ThemePicker";
import AmbientMusic from "./AmbientMusic";

/**
 * Shared chrome for every room in the house: a way back to the den, the
 * room's name on a pixel sign, and the theme picker.
 */
export default function RoomShell({
  title,
  tagline,
  children,
}: {
  title: string;
  tagline?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="font-pixel text-ink-soft hover:text-ink shrink-0 text-sm transition-colors"
        >
          ← the den
        </Link>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <AmbientMusic />
          <ThemePicker />
        </div>
      </header>

      <div className="flex flex-col items-center px-4 pt-2 pb-6 text-center">
        <h1 className="font-pixel text-ink pixel-frame bg-surface px-5 py-2 text-2xl sm:text-3xl">
          {title}
        </h1>
        {tagline && <p className="text-ink-soft mt-3 text-sm">{tagline}</p>}
      </div>

      {children}
    </main>
  );
}
