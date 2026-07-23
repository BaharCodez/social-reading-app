import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/app/lib/prisma";
import ThemePicker from "./components/ThemePicker";
import AmbientMusic from "./components/AmbientMusic";
import DenGame from "./components/DenGame";

/* The den: a walkable pixel room where every piece of furniture is a door
   into a section of the site. Old share links (`/?book=…`) predate the
   house and are forwarded to the study. */

export default async function Den({
  searchParams,
}: {
  searchParams: Promise<{ book?: string | string[] }>;
}) {
  const { book } = await searchParams;
  if (typeof book === "string" && book) {
    redirect(`/study?book=${encodeURIComponent(book)}`);
  }

  // Render per request (searchParams already implies it, but the frame
  // query below must never run during a database-less CI build).
  await connection();

  // The first few hallway frames get auto-hung on the den wall.
  const wallFrames = await prisma.frame.findMany({
    where: { kind: { not: "sandbox" } },
    orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
    take: 5,
    select: {
      id: true,
      kind: true,
      title: true,
      subtitle: true,
      detail: true,
      years: true,
      link: true,
    },
  });

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      <header className="flex items-center justify-end gap-2 px-4 pt-3 sm:px-6">
        <AmbientMusic />
        <ThemePicker />
      </header>

      {/* the hanging sign */}
      <div className="flex flex-col items-center px-4">
        <div className="bg-shelf-edge h-4 w-1" />
        <h1 className="font-pixel text-ink pixel-frame bg-surface px-6 py-3 text-3xl sm:text-4xl">
          bahar&apos;s house
        </h1>
        <p className="text-ink-soft mt-3 text-sm">
          a cozy corner for books, notes &amp; blinking lights
        </p>
        <p className="font-pixel text-ink-soft/80 mt-2 text-xs">
          walk with ← → (or tap the floor) · press E at a door to enter
        </p>
      </div>

      {/* the room */}
      <div className="mt-auto">
        <DenGame frames={wallFrames} />
      </div>

      {/* the foundation */}
      <div className="border-shelf-edge bg-shelf-edge flex h-9 shrink-0 items-center justify-center border-t-4">
        <Link
          href="/login"
          className="font-pixel text-accent-ink/70 hover:text-accent-ink text-xs transition-colors"
        >
          owner&apos;s entrance
        </Link>
      </div>
    </main>
  );
}
