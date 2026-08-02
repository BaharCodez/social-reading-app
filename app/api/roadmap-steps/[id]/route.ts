import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireOwner } from "@/app/lib/session";

// Tick a roadmap step done / undone. Owner-only — it's Bahar's progress.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireOwner();
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (typeof body?.done !== "boolean") {
    return new NextResponse(null, { status: 400 });
  }

  const step = await prisma.roadmapStep
    .update({ where: { id }, data: { done: body.done } })
    .catch(() => null);
  if (!step) return new NextResponse(null, { status: 404 });
  return NextResponse.json({ id: step.id, done: step.done });
}
