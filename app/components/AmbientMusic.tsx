"use client";

import { useEffect, useRef, useState } from "react";

// Gentle generative ambient — soft pentatonic notes over a low drone, all
// synthesised in the browser (no audio file). Plant Shop theme only.
const SCALE = [196.0, 220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25];

export default function AmbientMusic() {
  const [theme, setTheme] = useState("");
  const [playing, setPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  // Track the active theme (deferred initial read; observer for changes).
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => setTheme(el.dataset.theme ?? ""));
    obs.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    const id = requestAnimationFrame(() => setTheme(el.dataset.theme ?? ""));
    return () => {
      obs.disconnect();
      cancelAnimationFrame(id);
    };
  }, []);

  // Start/stop the soundscape based on play state + theme.
  useEffect(() => {
    const active = playing && theme === "plantshop";
    if (!active) {
      stopRef.current?.();
      stopRef.current = null;
      return;
    }

    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;
    void ctx.resume();

    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 2);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1100;
    master.connect(filter);
    filter.connect(ctx.destination);

    const drone = ctx.createOscillator();
    drone.type = "sine";
    drone.frequency.value = 98;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.06;
    drone.connect(droneGain);
    droneGain.connect(master);
    drone.start();

    const tick = () => {
      const f = SCALE[Math.floor(Math.random() * SCALE.length)];
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = f;
      const g = ctx.createGain();
      const t = ctx.currentTime;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.18, t + 1.5);
      g.gain.linearRampToValueAtTime(0, t + 4);
      o.connect(g);
      g.connect(master);
      o.start(t);
      o.stop(t + 4.2);
    };
    tick();
    const timer = window.setInterval(tick, 2600);

    stopRef.current = () => {
      clearInterval(timer);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
      try {
        drone.stop(ctx.currentTime + 0.9);
      } catch {
        /* already stopped */
      }
    };
    return () => {
      stopRef.current?.();
      stopRef.current = null;
    };
  }, [playing, theme]);

  if (theme !== "plantshop") return null;

  return (
    <button
      onClick={() => setPlaying((p) => !p)}
      aria-label={playing ? "Turn off music" : "Play calming music"}
      title={playing ? "Turn off music" : "Play calming music"}
      className="border-line text-ink-soft hover:bg-surface rounded-full border px-2.5 py-1 text-sm"
    >
      {playing ? "♪ on" : "♪ off"}
    </button>
  );
}
