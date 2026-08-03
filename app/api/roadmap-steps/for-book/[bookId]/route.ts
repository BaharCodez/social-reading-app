import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { isOwner, requireOwner } from "@/app/lib/session";

// Roadmap steps that link into a given book, so the reader can auto-tick each
// section as it's read. Owner-only: it's Bahar's progress and only she can
// change it — visitors get an empty list and never write (see AGENTS.md).

// Pull the EPUB href out of a step's link, e.g.
// "/study?book=<id>&loc=ch01.html%23sec" -> "ch01.html#sec".
function locFromLink(link: string | null): string | null {
  const q = link?.split("?")[1];
  return q ? new URLSearchParams(q).get("loc") : null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bookId: string }> },
) {
  // Non-owners simply don't track — hand back nothing rather than a 401.
  if (!(await isOwner())) return NextResponse.json([]);
  const { bookId } = await params;
  const steps = await prisma.roadmapStep.findMany({
    where: { link: { contains: `book=${bookId}` } },
    select: { id: true, link: true, done: true },
  });
  const out = steps
    .map((s) => ({ id: s.id, done: s.done, loc: locFromLink(s.link) }))
    .filter((s): s is { id: string; done: boolean; loc: string } => !!s.loc);
  return NextResponse.json(out);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const denied = await requireOwner();
  if (denied) return denied;

  const { bookId } = await params;
  const body = await req.json().catch(() => null);
  const ids: unknown = body?.doneIds;
  if (!Array.isArray(ids) || ids.some((i) => typeof i !== "string")) {
    return new NextResponse(null, { status: 400 });
  }

  // Reading only ever adds progress — tick, never untick. Scope the update to
  // this book so a stray id can't flip a step on some other roadmap.
  await prisma.roadmapStep.updateMany({
    where: {
      id: { in: ids as string[] },
      link: { contains: `book=${bookId}` },
    },
    data: { done: true },
  });
  return NextResponse.json({ ok: true });
}
