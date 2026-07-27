import "server-only";
import { NextResponse } from "next/server";
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

// The owner: the account matching OWNER_EMAIL, or the oldest account when
// that's unset. Anyone may look around the house; only she rearranges it.
export async function isOwner(): Promise<boolean> {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return false;

  const ownerEmail = process.env.OWNER_EMAIL?.toLowerCase();
  if (ownerEmail) return email === ownerEmail;

  const oldest = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    select: { email: true },
  });
  return oldest?.email?.toLowerCase() === email;
}

// Route-handler guard for anything that changes the house: returns null for
// the signed-in owner, otherwise the 401 response to send back.
export async function requireOwner(): Promise<NextResponse | null> {
  if (await isOwner()) return null;
  return NextResponse.json(
    { error: "Only the keeper of this house can change things — sign in." },
    { status: 401 },
  );
}
