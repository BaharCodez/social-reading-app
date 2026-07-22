import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { postInputSchema } from "@/app/lib/validation";

// Everything is public — drafts too; they're just not "published" yet.
export async function GET() {
  const posts = await prisma.post.findMany({
    orderBy: [{ publishedAt: { sort: "desc", nulls: "first" } }],
    select: { id: true, title: true, publishedAt: true, updatedAt: true },
  });
  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = postInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid post." },
      { status: 400 },
    );
  }

  const { published, ...rest } = parsed.data;
  const post = await prisma.post.create({
    data: { ...rest, publishedAt: published ? new Date() : null },
    select: { id: true },
  });
  return NextResponse.json(post, { status: 201 });
}
