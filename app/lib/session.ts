import "server-only";
import { auth } from "@/app/lib/auth";

// Returns the signed-in user's id, or null when there is no session.
export async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
