import "server-only";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

// Returns the signed-in user's id, or null when there is no session.
export async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

// Who a write belongs to: the signed-in user if there is one, otherwise the
// site owner. The house needs no sign-in — anonymous writes simply belong
// to the owner (OWNER_EMAIL in .env, falling back to the oldest account).
export async function actorUserId(): Promise<string | null> {
  const signedIn = await currentUserId();
  if (signedIn) return signedIn;

  const ownerEmail = process.env.OWNER_EMAIL;
  if (ownerEmail) {
    const owner = await prisma.user.findUnique({
      where: { email: ownerEmail },
      select: { id: true },
    });
    if (owner) return owner.id;
  }

  const oldest = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return oldest?.id ?? null;
}
