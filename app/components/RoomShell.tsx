import Link from "next/link";
import RoomBanner from "./RoomBanner";

/**
 * Shared chrome for every room in the house. Navigation lives in the sidebar,
 * so a room introduces itself with a botanical image banner, cottage-style:
 * a typewriter eyebrow over a serif heading. A sub-room can pass `back` for a
 * way out. Without an `image` it falls back to a plain text header.
 */
export default function RoomShell({
  title,
  heading,
  tagline,
  image,
  back,
  children,
}: {
  title: string;
  heading?: string;
  tagline?: string;
  image?: { src: string; alt: string };
  back?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <div className="fade-up flex flex-1 flex-col">
      {image ? (
        <>
          <RoomBanner title={title} heading={heading} image={image} />
          {(back || tagline) && (
            <div className="mx-auto w-full max-w-3xl px-6 pt-6 sm:px-8">
              {back && (
                <Link
                  href={back.href}
                  className="text-ink-soft hover:text-accent mb-3 inline-block font-mono text-xs transition-colors"
                >
                  ← {back.label}
                </Link>
              )}
              {tagline && (
                <p className="text-ink-soft text-base leading-relaxed">
                  {tagline}
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="mx-auto w-full max-w-3xl px-6 pt-12 pb-4 sm:px-8">
          {back && (
            <Link
              href={back.href}
              className="text-ink-soft hover:text-accent mb-3 inline-block font-mono text-xs transition-colors"
            >
              ← {back.label}
            </Link>
          )}
          <span className="text-accent-2 font-mono text-xs tracking-[0.2em] uppercase">
            — {title}
          </span>
          {tagline && (
            <p className="text-ink-soft mt-2 text-base leading-relaxed">
              {tagline}
            </p>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
