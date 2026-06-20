"use client";

import { signOut } from "next-auth/react";
import ThemeToggle from "./ThemeToggle";

export default function SignedInBar({ userName }: { userName: string }) {
  return (
    <div className="text-ink-soft flex items-center justify-end gap-3 px-6 py-3 text-sm">
      <span>
        Signed in as <span className="text-ink font-medium">{userName}</span>
      </span>
      <ThemeToggle />
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="hover:text-ink"
      >
        Log out
      </button>
    </div>
  );
}
