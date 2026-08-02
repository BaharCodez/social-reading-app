"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The Konami code opens the hidden visitors page. The page itself is still
// owner-only, so the code is just for fun / obscurity. ↑↑↓↓←→←→ B A
const CODE = [
  "arrowup",
  "arrowup",
  "arrowdown",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "arrowleft",
  "arrowright",
  "b",
  "a",
];

export default function SecretDoor() {
  const router = useRouter();

  useEffect(() => {
    let i = 0;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === CODE[i]) {
        i++;
        if (i === CODE.length) {
          i = 0;
          router.push("/visitors");
        }
      } else {
        i = k === CODE[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return null;
}
