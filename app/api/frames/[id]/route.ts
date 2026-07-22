import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { frameInputSchema } from "@/app/lib/validation";

// Rewrite a frame's plaque.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = frameInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid frame." },
      { status: 400 },
    );
  }

  const { link, years, ...rest } = parsed.data;
  const frame = await prisma.frame
    .update({
      where: { id },
      data: {
        ...rest,
        ...(years !== undefined && { years: years || null }),
        ...(link !== undefined && { link: link || null }),
      },
    })
    .catch(() => null);
  if (!frame) return new NextResponse(null, { status: 404 });

  return NextResponse.json(frame);
}

// Take a frame off the wall.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const deleted = await prisma.frame
    .delete({ where: { id } })
    .catch(() => null);
  if (!deleted) return new NextResponse(null, { status: 404 });

  return new NextResponse(null, { status: 204 });
}
