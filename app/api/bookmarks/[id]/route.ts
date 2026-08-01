import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireOwner } from "@/app/lib/session";

// Star / unstar a bookmark — moves it in and out of the special pile.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireOwner();
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (typeof body?.favorite !== "boolean") {
    return new NextResponse(null, { status: 400 });
  }

  const bookmark = await prisma.bookmark
    .update({ where: { id }, data: { favorite: body.favorite } })
    .catch(() => null);
  if (!bookmark) return new NextResponse(null, { status: 404 });
  return NextResponse.json(bookmark);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireOwner();
  if (denied) return denied;

  const { id } = await params;
  const deleted = await prisma.bookmark
    .delete({ where: { id } })
    .catch(() => null);
  if (!deleted) return new NextResponse(null, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
