"use client";

import { useEffect, useState } from "react";

const ALARM_MS = 2000;

/* Two-tone siren, straight from the oscillator — no audio file needed.
   Only ever fires from a click the visitor just made, so autoplay is fine. */
function blare() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    gain.gain.value = 0.04;
    osc.connect(gain).connect(ctx.destination);
    const t0 = ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      osc.frequency.setValueAtTime(880, t0 + i * 0.5);
      osc.frequency.setValueAtTime(587, t0 + i * 0.5 + 0.25);
    }
    osc.start(t0);
    osc.stop(t0 + ALARM_MS / 1000);
    osc.onended = () => void ctx.close();
  } catch {
    /* no sound is fine */
  }
}

/* The house's security system. Watches every API write from this tab and,
   when one bounces off the owner gate (401/403), floods the room with red
   for a couple of seconds. Mounted once in the root layout. */
export default function IntruderAlarm() {
  const [tripped, setTripped] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const original = window.fetch;

    window.fetch = async (input, init) => {
      const res = await original(input, init);
      try {
        const method = (
          init?.method ?? (input instanceof Request ? input.method : "GET")
        ).toUpperCase();
        const url = new URL(
          input instanceof Request ? input.url : String(input),
          window.location.origin,
        );
        const isApiWrite =
          url.origin === window.location.origin &&
          url.pathname.startsWith("/api/") &&
          !url.pathname.startsWith("/api/auth") &&
          method !== "GET" &&
          method !== "HEAD";
        if (isApiWrite && (res.status === 401 || res.status === 403)) {
          setTripped(true);
          blare();
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => setTripped(false), ALARM_MS);
        }
      } catch {
        /* never let the alarm break a real request */
      }
      return res;
    };

    return () => {
      window.fetch = original;
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!tripped) return null;

  return (
    <div
      aria-live="assertive"
      className="intruder-alarm pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center"
    >
      <div className="intruder-banner font-pixel rounded-lg border-4 border-red-500 bg-black/85 px-6 py-4 text-center text-red-500">
        <p className="text-2xl sm:text-3xl">⚠ INTRUDER ALERT ⚠</p>
        <p className="mt-1 text-sm text-red-300">
          you can&apos;t touch that — this is bahar&apos;s house
        </p>
      </div>
    </div>
  );
}
