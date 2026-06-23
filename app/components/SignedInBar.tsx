"use client";

import { signOut } from "next-auth/react";
import ThemePicker from "./ThemePicker";
import AmbientMusic from "./AmbientMusic";

export default function SignedInBar({ userName }: { userName: string }) {
  return (
    <div className="touch-scroll text-ink-soft flex items-center gap-3 overflow-x-auto px-4 py-3 text-sm sm:px-6">
      <span className="shrink-0">
        <span className="hidden sm:inline">Signed in as </span>
        <span className="text-ink font-medium">{userName}</span>
      </span>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <span className="text-ink-soft/50 hidden text-[10px] sm:inline">
          build {process.env.NEXT_PUBLIC_BUILD}
        </span>
        <AmbientMusic />
        <ThemePicker />
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="hover:text-ink shrink-0"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
