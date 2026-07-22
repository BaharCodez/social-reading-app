import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// Toggle a note done/undone (or reword it).
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const data: { done?: boolean; text?: string } = {};
  if (typeof body?.done === "boolean") data.done = body.done;
  if (typeof body?.text === "string" && body.text.trim()) {
    data.text = body.text.trim().slice(0, 500);
  }

  const idea = await prisma.idea
    .update({ where: { id }, data })
    .catch(() => null);
  if (!idea) return new NextResponse(null, { status: 404 });
  return NextResponse.json(idea);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const deleted = await prisma.idea.delete({ where: { id } }).catch(() => null);
  if (!deleted) return new NextResponse(null, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
