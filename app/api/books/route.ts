import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { currentUserId } from "@/app/lib/session";

// List the current user's library (metadata + how many notes each book has).
export async function GET() {
  const userId = await currentUserId();
  if (!userId) return new NextResponse(null, { status: 401 });

  const books = await prisma.book.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      author: true,
      coverDataUrl: true,
      createdAt: true,
      _count: { select: { annotations: true } },
    },
  });

  return NextResponse.json(
    books.map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      coverDataUrl: b.coverDataUrl,
      createdAt: b.createdAt.getTime(),
      noteCount: b._count.annotations,
    })),
  );
}

// Upload a new EPUB (multipart form: file, title, author, coverDataUrl).
export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) return new NextResponse(null, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const title = String(form.get("title") ?? "").trim() || "Untitled";
  const author = String(form.get("author") ?? "").trim() || "Unknown author";
  const coverDataUrl = form.get("coverDataUrl");

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }

  const data = Buffer.from(await file.arrayBuffer());

  const book = await prisma.book.create({
    data: {
      title,
      author,
      coverDataUrl: typeof coverDataUrl === "string" ? coverDataUrl : null,
      data,
      ownerId: userId,
    },
    select: { id: true, title: true, author: true, coverDataUrl: true },
  });

  return NextResponse.json(book, { status: 201 });
}
