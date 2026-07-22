import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { frameInputSchema } from "@/app/lib/validation";

// The hallway wall is public — anyone can look at the frames.
export async function GET() {
  const frames = await prisma.frame.findMany({
    orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(frames);
}

// Anyone in the house can hang a frame.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = frameInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid frame." },
      { status: 400 },
    );
  }

  const { link, years, ...rest } = parsed.data;
  const frame = await prisma.frame.create({
    data: { ...rest, years: years || null, link: link || null },
  });
  return NextResponse.json(frame, { status: 201 });
}
