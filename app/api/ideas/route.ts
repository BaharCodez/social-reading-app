import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { ideaInputSchema } from "@/app/lib/validation";

// The hobby board is wide open — look, pin, solve.
export async function GET() {
  const ideas = await prisma.idea.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(ideas);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = ideaInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid idea." },
      { status: 400 },
    );
  }

  const idea = await prisma.idea.create({ data: parsed.data });
  return NextResponse.json(idea, { status: 201 });
}
