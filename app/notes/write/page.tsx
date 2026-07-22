import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import PostEditor from "@/app/components/PostEditor";

export const metadata: Metadata = {
  title: "writing desk — bahar's house",
};

export default async function WritePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const post = id
    ? await prisma.post.findUnique({
        where: { id },
        select: { id: true, title: true, content: true, publishedAt: true },
      })
    : null;
  if (id && !post) notFound();

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center px-4 py-3 sm:px-6">
        <Link
          href="/notes"
          className="font-pixel text-ink-soft hover:text-ink text-sm transition-colors"
        >
          ← writing room
        </Link>
      </header>
      <PostEditor
        initial={
          post
            ? {
                id: post.id,
                title: post.title,
                content: post.content,
                published: !!post.publishedAt,
              }
            : undefined
        }
      />
    </main>
  );
}
