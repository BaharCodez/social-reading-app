import type { Metadata } from "next";
import { prisma } from "@/app/lib/prisma";
import RoomShell from "@/app/components/RoomShell";
import HallwayWall from "@/app/components/HallwayWall";

export const metadata: Metadata = {
  title: "the hallway — bahar's house",
  description: "Jobs, projects, and achievements, framed on the wall.",
};

// The wall is wide open — anyone in the house can hang or take down frames.
export default async function HallwayPage() {
  const frames = await prisma.frame.findMany({
    // sandbox builds live on the workshop shelf, not the hallway wall
    where: { kind: { not: "sandbox" } },
    orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
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
    <RoomShell
      title="the hallway"
      tagline="jobs, projects & achievements, framed on the wall"
    >
      <HallwayWall frames={frames} canEdit />

      {/* the nameplate by the door */}
      <div className="flex justify-center pb-12">
        <div className="pixel-frame bg-surface px-6 py-4 text-center">
          <p className="font-pixel text-ink text-lg">bahar</p>
          <p className="text-ink-soft mt-1 text-sm">
            reads · writes · solders — sometimes all in one evening
          </p>
        </div>
      </div>
    </RoomShell>
  );
}
