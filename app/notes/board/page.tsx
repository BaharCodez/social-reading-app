import type { Metadata } from "next";
import { connection } from "next/server";
import { prisma } from "@/app/lib/prisma";
import RoomShell from "@/app/components/RoomShell";
import IdeaBoard from "@/app/components/IdeaBoard";

export const metadata: Metadata = {
  title: "the hobby board — bahar's house",
  description:
    "A corkboard of things to read about, write about, explore, and solve.",
};

export default async function BoardPage() {
  // Render per request — notes come and go, and CI builds have no database.
  await connection();
  const ideas = await prisma.idea.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, bucket: true, text: true, done: true },
  });

  return (
    <RoomShell
      title="the hobby board"
      tagline="things to read about, write about, explore & solve"
    >
      <IdeaBoard ideas={ideas} canEdit />
    </RoomShell>
  );
}
