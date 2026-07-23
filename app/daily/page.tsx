import type { Metadata } from "next";
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
  const day = serverDay();
  const [article, ticks] = await Promise.all([
    articleOfTheDay(day).catch(() => null),
    prisma.dailyTick.findMany({
      orderBy: { day: "desc" },
      take: 400,
      select: { kind: true, day: true },
    }),
  ]);

  return (
    <RoomShell
      title="the daily room"
      tagline="one article, one sip of spanish — small, every day"
    >
      <DailyRoom
        article={article}
        scene={sceneOfTheDay(day)}
        listening={listeningOfTheDay(day)}
        ticks={ticks}
        serverDay={day}
      />
    </RoomShell>
  );
}
