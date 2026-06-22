"use client";

import { useEffect, useRef, useState } from "react";

// Cozy lo-fi-ish generative music — a slow chord progression on soft detuned
// pads, an occasional bell melody, warmth (lowpass) and echo (feedback delay).
// All synthesised in the browser; no audio files. Available in every theme.

// I–vi–IV–V in C, voiced low and warm.
const CHORDS = [
  [130.81, 164.81, 196.0, 246.94], // Cmaj7
  [110.0, 130.81, 164.81, 196.0], // Am7
  [87.31, 110.0, 130.81, 164.81], // Fmaj7
  [98.0, 123.47, 146.83, 174.61], // G7
];
// C major pentatonic, up high for the melody.
const MELODY = [523.25, 587.33, 659.25, 783.99, 880.0];

export default function AmbientMusic() {
  const [playing, setPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!playing) {
      stopRef.current?.();
      stopRef.current = null;
      return;
    }

    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;
    void ctx.resume();
    const now = () => ctx.currentTime;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0, now());
    master.gain.linearRampToValueAtTime(0.22, now() + 3);
    const warmth = ctx.createBiquadFilter();
    warmth.type = "lowpass";
    warmth.frequency.value = 1500;
    master.connect(warmth);
    warmth.connect(ctx.destination);

    const delay = ctx.createDelay();
    delay.delayTime.value = 0.38;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.32;
    const wet = ctx.createGain();
    wet.gain.value = 0.3;
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(master);

    const playChord = (freqs: number[], dur: number) => {
      const t = now();
      for (const f of freqs) {
        for (const det of [-4, 4]) {
          const o = ctx.createOscillator();
          o.type = "sine";
          o.frequency.value = f;
          o.detune.value = det;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.05, t + 3);
          g.gain.linearRampToValueAtTime(0, t + dur);
          o.connect(g);
          g.connect(master);
          g.connect(delay);
          o.start(t);
          o.stop(t + dur + 0.2);
        }
      }
    };

    const playNote = () => {
      if (Math.random() < 0.35) return;
      const f = MELODY[Math.floor(Math.random() * MELODY.length)];
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = f;
      const g = ctx.createGain();
      const t = now();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.1, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
      o.connect(g);
      g.connect(master);
      g.connect(delay);
      o.start(t);
      o.stop(t + 2);
    };

    let chord = 0;
    playChord(CHORDS[chord], 8);
    const chordTimer = window.setInterval(() => {
      chord = (chord + 1) % CHORDS.length;
      playChord(CHORDS[chord], 8);
    }, 7000);
    const melodyTimer = window.setInterval(playNote, 3200);

    stopRef.current = () => {
      clearInterval(chordTimer);
      clearInterval(melodyTimer);
      master.gain.cancelScheduledValues(now());
      master.gain.setValueAtTime(master.gain.value, now());
      master.gain.linearRampToValueAtTime(0, now() + 1);
    };
    return () => {
      stopRef.current?.();
      stopRef.current = null;
    };
  }, [playing]);

  return (
    <button
      onClick={() => setPlaying((p) => !p)}
      aria-label={playing ? "Turn off music" : "Play calming music"}
      title={playing ? "Turn off music" : "Play calming music"}
      className="border-line text-ink-soft hover:bg-surface shrink-0 rounded-full border px-2.5 py-1 text-sm"
    >
      {playing ? "♪ on" : "♪ off"}
    </button>
  );
}
