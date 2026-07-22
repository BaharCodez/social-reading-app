import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { postInputSchema } from "@/app/lib/validation";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return new NextResponse(null, { status: 404 });

  return NextResponse.json(post);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = postInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid post." },
      { status: 400 },
    );
  }

  const existing = await prisma.post.findUnique({
    where: { id },
    select: { publishedAt: true },
  });
  if (!existing) return new NextResponse(null, { status: 404 });

  const { published, ...rest } = parsed.data;
  const post = await prisma.post.update({
    where: { id },
    data: {
      ...rest,
      // Publishing keeps the original date if it was already public.
      publishedAt: published ? (existing.publishedAt ?? new Date()) : null,
    },
    select: { id: true, publishedAt: true },
  });
  return NextResponse.json(post);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const deleted = await prisma.post.delete({ where: { id } }).catch(() => null);
  if (!deleted) return new NextResponse(null, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
