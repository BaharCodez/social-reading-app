import Link from "next/link";

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
          <div
            className="border-line relative h-44 overflow-hidden border-b sm:h-56"
            style={{ backgroundColor: "var(--bg-2)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt={image.alt}
              loading="lazy"
              className="h-full w-full object-cover"
              style={{ filter: "sepia(28%) saturate(82%) brightness(0.96)" }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, transparent 35%, var(--bg) 100%)",
              }}
            />
            <div className="absolute bottom-5 left-6 sm:left-8">
              <span className="text-accent-2 font-mono text-xs tracking-[0.2em] uppercase">
                {title}
              </span>
              <h1 className="text-ink mt-1 font-serif text-3xl sm:text-4xl">
                {heading ?? title}
              </h1>
            </div>
          </div>
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
