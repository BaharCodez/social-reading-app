/**
 * Shared chrome for every room in the house. Navigation now lives in the
 * sidebar, so a room just introduces itself: a small typewriter eyebrow and a
 * serif heading, cottage-style.
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
    <div className="fade-up flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-3xl px-6 pt-12 pb-4 sm:px-8">
        <span className="text-accent-2 font-mono text-xs tracking-[0.2em] uppercase">
          — {title}
        </span>
        {tagline && (
          <p className="text-ink-soft mt-2 text-base leading-relaxed">
            {tagline}
          </p>
        )}
      </div>

      {children}
    </div>
  );
}
