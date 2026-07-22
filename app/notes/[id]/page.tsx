import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { prisma } from "@/app/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    select: { title: true },
  });
  if (!post) return { title: "writing room — bahar's house" };
  return { title: `${post.title} — bahar's house` };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) notFound();

  const date = post.publishedAt ?? post.updatedAt;

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/notes"
          className="font-pixel text-ink-soft hover:text-ink text-sm transition-colors"
        >
          ← writing room
        </Link>
        <Link
          href={`/notes/write?id=${post.id}`}
          className="text-ink-soft hover:text-ink ml-auto text-sm"
        >
          ✎ edit
        </Link>
      </header>

      <article className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 sm:px-6">
        <p className="text-accent-2 font-mono text-sm font-bold">
          {date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
          {!post.publishedAt && " · draft"}
        </p>
        <h1 className="text-ink mt-2 font-serif text-4xl font-black tracking-tight sm:text-5xl">
          {post.title}
        </h1>
        <div className="border-ink mt-4 border-b-4" />
        <div
          className="article mt-6"
          dangerouslySetInnerHTML={{
            __html: marked.parse(post.content, { async: false, breaks: true }),
          }}
        />
      </article>
    </main>
  );
}
