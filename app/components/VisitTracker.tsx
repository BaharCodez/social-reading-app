"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Pings /api/track on each page view. The endpoint ignores the owner and
// stores only coarse location + referrer + device. No-op if it fails.
export default function VisitTracker() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || last.current === pathname) return;
    last.current = pathname;
    const ref =
      document.referrer && !document.referrer.startsWith(location.origin)
        ? document.referrer
        : "";
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, ref }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
