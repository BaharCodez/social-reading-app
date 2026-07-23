import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { dailyTickSchema } from "@/app/lib/validation";

// The streak board is public, like the rest of the house.
export async function GET() {
  const ticks = await prisma.dailyTick.findMany({
    orderBy: { day: "desc" },
    take: 400,
    select: { kind: true, day: true },
  });
  return NextResponse.json(ticks);
}

// Tick off today's habit. Idempotent — ticking twice keeps one row.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = dailyTickSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid tick." },
      { status: 400 },
    );
  }

  const { kind, day } = parsed.data;
  const tick = await prisma.dailyTick.upsert({
    where: { kind_day: { kind, day } },
    update: {},
    create: { kind, day },
  });
  return NextResponse.json(tick, { status: 201 });
}
