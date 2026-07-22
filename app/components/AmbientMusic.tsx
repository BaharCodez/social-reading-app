"use client";

import { useEffect, useState } from "react";

// One shared <audio> element for the whole site: client-side navigation
// keeps this module alive, so the music carries on as you walk between
// rooms, and every ♪ button controls the same player.
let audio: HTMLAudioElement | null = null;
function getAudio() {
  if (!audio) {
    audio = new Audio("/music/cozy-lounge.mp3");
    audio.loop = true;
    audio.volume = 0.45;
  }
  return audio;
}

export default function AmbientMusic() {
  const [playing, setPlaying] = useState(false);

  // Stay in sync with the shared player (another button may toggle it).
  useEffect(() => {
    const el = getAudio();
    const sync = () => setPlaying(!el.paused);
    sync();
    el.addEventListener("play", sync);
    el.addEventListener("pause", sync);
    return () => {
      el.removeEventListener("play", sync);
      el.removeEventListener("pause", sync);
    };
  }, []);

  const toggle = () => {
    const el = getAudio();
    if (el.paused) void el.play().catch(() => {});
    else el.pause();
  };

  return (
    <button
      onClick={toggle}
      aria-label={playing ? "Turn off music" : "Play cozy music"}
      title={playing ? "Turn off music" : "Play cozy music"}
      className="border-line text-ink-soft hover:bg-surface shrink-0 rounded-full border px-2.5 py-1 text-sm"
    >
      {playing ? "♪ on" : "♪ off"}
    </button>
  );
}
