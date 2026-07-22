import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { actorUserId } from "@/app/lib/session";

// You can only delete your own notes.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await actorUserId();
  if (!userId) return new NextResponse(null, { status: 401 });

  const { id } = await params;
  const annotation = await prisma.annotation.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!annotation) return new NextResponse(null, { status: 404 });
  if (annotation.userId !== userId)
    return new NextResponse(null, { status: 403 });

  await prisma.annotation.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
