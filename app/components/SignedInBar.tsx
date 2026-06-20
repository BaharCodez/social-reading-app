"use client";

import { signOut } from "next-auth/react";
import ThemeToggle from "./ThemeToggle";

export default function SignedInBar({ userName }: { userName: string }) {
  return (
    <div className="flex items-center justify-end gap-3 px-6 py-3 text-sm text-zinc-500 dark:text-zinc-400">
      <span>
        Signed in as{" "}
        <span className="font-medium text-zinc-700 dark:text-zinc-200">
          {userName}
        </span>
      </span>
      <ThemeToggle />
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        Log out
      </button>
    </div>
  );
}
