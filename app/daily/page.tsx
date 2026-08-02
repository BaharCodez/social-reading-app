import type { Metadata } from "next";
import { connection } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { articleOfTheDay } from "@/app/lib/feeds";
import { listeningOfTheDay, sceneOfTheDay } from "@/app/lib/spanish";
import RoomShell from "@/app/components/RoomShell";
import DailyRoom from "@/app/components/DailyRoom";

export const metadata: Metadata = {
  title: "the daily room — bahar's house",
  description:
    "One engineering article and one sip of conversational Spanish, every day.",
};

function serverDay() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default async function DailyPage() {
  // Render per request — today's date, ticks, and the feed pool all move,
  // and CI builds have no database.
  await connection();
  const day = serverDay();
  const [article, ticks, bookmarks] = await Promise.all([
    articleOfTheDay(day).catch(() => null),
    prisma.dailyTick.findMany({
      orderBy: { day: "desc" },
      take: 400,
      select: { kind: true, day: true },
    }),
    prisma.bookmark.findMany({
      orderBy: [{ favorite: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  return (
    <RoomShell
      title="the daily room"
      heading="The Daily Room"
      tagline="one article, one sip of spanish, small every day"
      image={{
        src: "https://images.unsplash.com/photo-1677846092922-5b685ba0afb2?w=1200&h=400&fit=crop&auto=format",
        alt: "A cup of coffee and a book on a windowsill",
      }}
    >
      <DailyRoom
        article={article}
        scene={sceneOfTheDay(day)}
        listening={listeningOfTheDay(day)}
        ticks={ticks}
        bookmarks={bookmarks}
        serverDay={day}
      />
    </RoomShell>
  );
}
