import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { isOwner } from "@/app/lib/session";
import RoomShell from "@/app/components/RoomShell";
import RoadmapView from "@/app/components/RoadmapView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const rm = await prisma.roadmap.findUnique({
    where: { slug },
    select: { title: true },
  });
  return { title: rm ? `${rm.title} — bahar's house` : "roadmap — bahar's house" };
}

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const [roadmap, canEdit] = await Promise.all([
    prisma.roadmap.findUnique({
      where: { slug },
      include: { steps: { orderBy: { order: "asc" } } },
    }),
    isOwner(),
  ]);
  if (!roadmap) notFound();

  return (
    <RoomShell
      title={roadmap.emoji + " " + roadmap.title.toLowerCase()}
      heading={roadmap.title}
      tagline={roadmap.subtitle}
      back={{ href: "/roadmaps", label: "roadmaps" }}
    >
      <RoadmapView steps={roadmap.steps} canEdit={canEdit} />
    </RoomShell>
  );
}
