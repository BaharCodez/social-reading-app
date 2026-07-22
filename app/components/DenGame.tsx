"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ---- The den as a tiny side-scroller --------------------------------------
   The room is a fixed-width "world"; the camera follows the gardener so the
   same scene works on a phone and a desktop. Furniture stays real links —
   walking and pressing E is the fun path, clicking/tapping still works. */

const WORLD_W = 1320; // px, world coordinates
const FLOOR_H = 56; // walkable floor strip height
const WALK_SPEED = 240; // px / second
const NEAR = 100; // how close counts as "at" a piece of furniture
const JUMP_V = 460; // takeoff speed, px / second
const GRAVITY = 1500; // px / second²

const ROOMS = [
  { href: "/study", label: "the study", x: 210 },
  { href: "/notes", label: "writing room", x: 490 },
  { href: "/workshop", label: "workshop", x: 770 },
  { href: "/hallway", label: "hallway", x: 1060 },
] as const;

// The nearest piece of furniture within reach of position x, if any.
// `s` is the world scale (wide screens stretch the room to fill).
function findActive(x: number, s: number) {
  let best: (typeof ROOMS)[number] | null = null;
  let bestD = NEAR;
  for (const room of ROOMS) {
    const d = Math.abs(x - room.x * s);
    if (d <= bestD) {
      best = room;
      bestD = d;
    }
  }
  return best;
}

const GARDENER_LINES = [
  "welcome in — the tea's still warm.",
  "the study is past the bookshelf →",
  "the esp32 hasn't phoned home yet…",
  "mind the plants, they bite. (they don't.)",
  "press E at a door to go in!",
];

/* Retro square-wave blip, generated on the fly — no audio files. */
let audioCtx: AudioContext | null = null;
function blip(freq = 520) {
  try {
    audioCtx ??= new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.13);
  } catch {
    /* no audio — fine */
  }
}

/* ---- Hand-drawn furniture (flat CSS blocks in the theme palette) --------- */

function PixelBookshelf() {
  const shelves = [
    ["h-10 bg-accent", "h-8 bg-accent-2", "h-9 bg-ink-soft", "h-10 bg-accent-2", "h-7 bg-accent"],
    ["h-8 bg-accent-2", "h-10 bg-accent", "h-7 bg-accent-2", "h-9 bg-accent", "h-8 bg-ink-soft"],
  ];
  return (
    <div className="border-shelf-edge bg-shelf w-36 border-4 px-1.5 pt-1.5 sm:w-40">
      {shelves.map((row, i) => (
        <div
          key={i}
          className="border-shelf-edge flex items-end gap-1 border-b-4 px-1 pt-1"
        >
          {row.map((spine, j) => (
            <div key={j} className={`w-4 flex-1 ${spine}`} />
          ))}
          {i === 0 && (
            <img
              src="/decor/plants/plant-2.png"
              alt=""
              aria-hidden
              className="h-5 w-auto select-none [image-rendering:pixelated]"
            />
          )}
        </div>
      ))}
    </div>
  );
}

function PixelDesk() {
  return (
    <div className="w-36 sm:w-40">
      <div className="flex items-end justify-center gap-2 px-3">
        <div className="border-line bg-surface h-9 w-14 space-y-1.5 border-2 p-1.5">
          <div className="bg-ink-soft/60 h-0.5 w-full" />
          <div className="bg-ink-soft/60 h-0.5 w-4/5" />
          <div className="bg-accent-2 h-0.5 w-3/5" />
        </div>
        {/* steam rising from the mug */}
        <div className="relative">
          <span className="steam absolute -top-3 left-1/2 h-2 w-0.5 -translate-x-1/2 rounded-full bg-white/60" />
          <div className="border-shelf-edge bg-accent-2 h-6 w-5 border-2" />
        </div>
        <img
          src="/decor/plants/plant-8.png"
          alt=""
          aria-hidden
          className="h-6 w-auto select-none [image-rendering:pixelated]"
        />
      </div>
      <div className="border-shelf-edge bg-shelf h-4 border-4" />
      <div className="flex justify-between px-3">
        <div className="bg-shelf-edge h-12 w-3" />
        <div className="bg-shelf-edge h-12 w-3" />
      </div>
    </div>
  );
}

function PixelWorkbench() {
  return (
    <div className="w-36 sm:w-40">
      <div className="flex items-end justify-center gap-2 px-3">
        <div className="relative h-8 w-16 border-2 border-emerald-900 bg-emerald-700">
          <div className="absolute top-1/2 left-1/2 h-3.5 w-6 -translate-x-1/2 -translate-y-1/2 bg-zinc-800" />
          <div className="absolute top-1 right-1 h-1.5 w-1.5 animate-pulse bg-red-500" />
          <div className="absolute bottom-0.5 left-1 flex gap-0.5">
            <div className="h-1 w-1 bg-amber-400" />
            <div className="h-1 w-1 bg-amber-400" />
            <div className="h-1 w-1 bg-amber-400" />
          </div>
        </div>
        <div className="border-shelf-edge bg-surface/70 flex h-7 w-4 items-end justify-center border-2">
          <div className="bg-accent-2 mb-1 h-6 w-1" />
        </div>
      </div>
      <div className="border-shelf-edge bg-shelf h-4 border-4" />
      <div className="flex justify-between px-3">
        <div className="bg-shelf-edge h-12 w-3" />
        <div className="bg-shelf-edge h-12 w-3" />
      </div>
    </div>
  );
}

function PixelDoorway() {
  return (
    <div className="flex items-end gap-2.5">
      <div className="mb-14 space-y-2">
        <div className="border-shelf-edge bg-surface flex h-10 w-8 items-center justify-center border-2">
          <div className="bg-accent h-6 w-4" />
        </div>
        <div className="border-shelf-edge bg-surface flex h-8 w-8 items-center justify-center border-2">
          <div className="bg-accent-2 h-4 w-4" />
        </div>
      </div>
      <div className="border-shelf-edge bg-shelf relative h-44 w-24 border-4">
        <div className="border-shelf-edge absolute inset-x-2 top-2 h-14 border-4" />
        <div className="border-shelf-edge absolute inset-x-2 top-20 bottom-2 border-4" />
        <div className="bg-accent-2 absolute top-1/2 left-2.5 h-2.5 w-2.5 rounded-full" />
      </div>
    </div>
  );
}

const FURNITURE: Record<string, () => React.ReactNode> = {
  "/study": PixelBookshelf,
  "/notes": PixelDesk,
  "/workshop": PixelWorkbench,
  "/hallway": PixelDoorway,
};

/* ---- The game -------------------------------------------------------------- */

export default function DenGame() {
  const router = useRouter();
  const stageRef = useRef<HTMLDivElement>(null);

  const [playerX, setPlayerX] = useState(90);
  const [jumpY, setJumpY] = useState(0);
  const [moving, setMoving] = useState(false);
  const [facing, setFacing] = useState<1 | -1>(1); // 1 = right
  const [stageW, setStageW] = useState(0);
  const [night, setNight] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<string | null>(null);

  const keys = useRef(new Set<string>());
  const target = useRef<number | null>(null);
  // The walk loop owns the position; `playerX` state mirrors it for render.
  const pos = useRef(90);
  // Jump state: height above the floor and vertical speed.
  const air = useRef({ y: 0, vy: 0 });
  const bubbleIdx = useRef(0);
  const leavingRef = useRef(false);
  const scaleRef = useRef(1);
  // Manual day/night choice (clicking the window); null = follow the clock.
  const nightOverride = useRef<boolean | null>(null);

  // On screens wider than the designed room, stretch the world to fill.
  const scale = Math.max(1, stageW / WORLD_W);
  const worldW = WORLD_W * scale;

  // Which furniture the player is standing at (nearest within reach).
  const active = findActive(playerX, scale);

  const enterRoom = useCallback(
    (room: { href: string; label: string }) => {
      if (leavingRef.current) return;
      leavingRef.current = true;
      blip(660);
      setLeaving(room.label);
      setTimeout(() => router.push(room.href), 420);
    },
    [router],
  );

  // Day/night from the visitor's real clock (after mount — SSR renders day),
  // unless they've clicked the window to choose for themselves.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("den-night");
      if (saved !== null) nightOverride.current = saved === "1";
    } catch {
      /* storage blocked — follow the clock */
    }
    const update = () => {
      if (nightOverride.current !== null) {
        setNight(nightOverride.current);
      } else {
        const h = new Date().getHours();
        setNight(h < 6 || h >= 20);
      }
    };
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, []);

  const toggleNight = (e: React.MouseEvent) => {
    e.stopPropagation();
    blip(380);
    setNight((n) => {
      const next = !n;
      nightOverride.current = next;
      try {
        localStorage.setItem("den-night", next ? "1" : "0");
      } catch {
        /* fine */
      }
      return next;
    });
  };

  // Track the visible stage width for the camera and world scale.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      scaleRef.current = Math.max(1, el.clientWidth / WORLD_W);
      setStageW(el.clientWidth);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);

  // Keyboard: arrows / WASD to walk, E or Enter to go through a door.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowleft", "arrowright", "a", "d"].includes(k)) {
        e.preventDefault();
        keys.current.add(k);
        target.current = null;
      } else if (k === " " || k === "arrowup" || k === "w") {
        e.preventDefault();
        // Jump — but only off the ground, this isn't Flappy Gardener.
        if (air.current.y === 0 && air.current.vy === 0) {
          air.current.vy = JUMP_V;
          blip(740);
        }
      } else if (k === "e" || k === "enter") {
        const room = findActive(pos.current, scaleRef.current);
        if (room) {
          e.preventDefault();
          enterRoom(room);
        }
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [enterRoom]);

  // The walk loop.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - last, 50) / 1000;
      last = now;

      let dir = 0;
      if (keys.current.has("arrowleft") || keys.current.has("a")) dir -= 1;
      if (keys.current.has("arrowright") || keys.current.has("d")) dir += 1;

      if (dir === 0 && target.current !== null) {
        const gap = target.current - pos.current;
        if (Math.abs(gap) < 6) target.current = null;
        else dir = gap > 0 ? 1 : -1;
      }

      if (dir !== 0) {
        pos.current = Math.max(
          50,
          Math.min(
            WORLD_W * scaleRef.current - 50,
            pos.current + dir * WALK_SPEED * dt,
          ),
        );
        setFacing(dir as 1 | -1);
        setMoving(true);
        setPlayerX(pos.current);
      } else {
        setMoving(false);
      }

      // Gravity.
      if (air.current.vy !== 0 || air.current.y > 0) {
        air.current.y += air.current.vy * dt;
        air.current.vy -= GRAVITY * dt;
        if (air.current.y <= 0) {
          air.current.y = 0;
          air.current.vy = 0;
        }
        setJumpY(air.current.y);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Camera follows the player; 0 until the stage has been measured.
  const camera = stageW
    ? Math.max(0, Math.min(playerX - stageW / 2, worldW - stageW))
    : 0;

  // Tap/click the floor to walk there.
  const onStageTap = (e: React.PointerEvent) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    target.current = Math.max(
      50,
      Math.min(worldW - 50, e.clientX - rect.left + camera),
    );
  };

  const speak = (e: React.MouseEvent) => {
    e.stopPropagation();
    blip(440);
    setBubble(GARDENER_LINES[bubbleIdx.current++ % GARDENER_LINES.length]);
    setTimeout(() => setBubble(null), 3200);
  };

  return (
    <div
      ref={stageRef}
      onPointerDown={onStageTap}
      className="relative h-[380px] w-full touch-none overflow-hidden select-none"
    >
      {/* the world — slides under the camera */}
      <div
        className="absolute inset-y-0 left-0 will-change-transform"
        style={{ width: worldW, transform: `translate3d(${-camera}px,0,0)` }}
      >
        {/* window on the wall — click it to switch day/night */}
        <div
          role="button"
          tabIndex={0}
          title="switch day / night"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={toggleNight}
          className="border-shelf-edge absolute top-4 h-24 w-36 cursor-pointer border-4"
          style={{ left: 560 * scale }}
        >
          {night ? (
            <div className="relative h-full w-full bg-gradient-to-b from-indigo-950 to-indigo-900">
              <div className="absolute top-3 right-5 h-6 w-6 rounded-full bg-amber-100 shadow-[0_0_12px_2px_rgba(254,243,199,0.7)]" />
              <div className="absolute top-8 left-6 h-1 w-1 bg-white/90" />
              <div className="absolute top-4 left-12 h-1 w-1 bg-white/70" />
              <div className="absolute top-12 left-16 h-1 w-1 bg-white/80" />
            </div>
          ) : (
            <div className="relative h-full w-full bg-gradient-to-b from-sky-200 to-amber-100">
              <div className="absolute top-3 right-5 h-7 w-7 rounded-full bg-amber-300 shadow-[0_0_14px_4px_rgba(252,211,77,0.6)]" />
            </div>
          )}
          <div className="bg-shelf-edge absolute inset-y-0 left-1/2 w-1 -translate-x-1/2" />
          <div className="bg-shelf-edge absolute inset-x-0 top-1/2 h-1 -translate-y-1/2" />
          <img
            src="/decor/plants/plant-6.png"
            alt=""
            aria-hidden
            className="absolute -bottom-1 left-2 h-5 w-auto [image-rendering:pixelated]"
          />
        </div>

        {/* furniture (real links: click/tap enters directly) */}
        {ROOMS.map((room) => {
          const Piece = FURNITURE[room.href];
          const isActive = active?.href === room.href;
          return (
            <div
              key={room.href}
              className="absolute flex -translate-x-1/2 flex-col items-center gap-2"
              style={{ left: room.x * scale, bottom: FLOOR_H - 2 }}
            >
              <span
                className={`font-pixel pixel-frame bg-surface text-ink px-2 py-1 text-xs transition-all duration-200 ${
                  isActive ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0"
                }`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => isActive && enterRoom(room)}
                role="button"
              >
                [E] enter
              </span>
              <Link
                href={room.href}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.preventDefault();
                  enterRoom(room);
                }}
                aria-label={`Enter ${room.label}`}
                className="group flex flex-col items-center gap-2 outline-none"
              >
                <div
                  className={`transition-transform duration-200 group-hover:-translate-y-1.5 ${
                    isActive ? "-translate-y-1.5" : ""
                  }`}
                >
                  <Piece />
                </div>
                <div className="-mt-1 h-1.5 w-4/5 rounded-full bg-black/15 blur-[1px]" />
                <span className="font-pixel text-ink border-line bg-surface rounded border-2 px-2 py-0.5 text-xs">
                  {room.label}
                </span>
              </Link>
            </div>
          );
        })}

        {/* plant shelf decor at the far end */}
        <img
          src="/decor/plantshelf.png"
          alt=""
          aria-hidden
          className="absolute h-24 w-auto [image-rendering:pixelated]"
          style={{
            left: 1210 * scale,
            bottom: FLOOR_H - 2,
            transform: "translateX(-50%)",
          }}
        />

        {/* the gardener — you */}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={speak}
          aria-label="The gardener (that's you) — click for a thought"
          className="absolute z-10 -translate-x-1/2 outline-none"
          style={{ left: playerX, bottom: FLOOR_H - 4 + jumpY }}
        >
          {bubble && (
            <span className="font-pixel pixel-frame bg-surface text-ink absolute bottom-full left-1/2 mb-2 w-44 -translate-x-1/2 px-2 py-1.5 text-center text-xs">
              {bubble}
            </span>
          )}
          <img
            src="/decor/gardener.png"
            alt=""
            className={`h-24 w-auto [image-rendering:pixelated] sm:h-28 ${moving ? "walk-bob" : ""}`}
            style={{ transform: `scaleX(${facing === 1 ? -1 : 1})` }}
          />
          <div className="mx-auto -mt-1 h-1.5 w-3/5 rounded-full bg-black/15 blur-[1px]" />
        </button>

        {/* the floor */}
        <div
          className="border-shelf-edge bg-shelf absolute inset-x-0 bottom-0 border-t-4 [background-image:repeating-linear-gradient(90deg,transparent,transparent_72px,var(--shelf-edge)_72px,var(--shelf-edge)_75px)]"
          style={{ height: FLOOR_H }}
        />

        {/* fireflies, after dark */}
        {night &&
          [220, 420, 640, 900, 1150].map((x, i) => (
            <span
              key={x}
              className="firefly absolute h-1.5 w-1.5 rounded-full bg-amber-300"
              style={{
                left: x * scale,
                bottom: FLOOR_H + 40 + (i % 3) * 30,
                animationDelay: `${i * 0.9}s`,
                boxShadow: "0 0 6px 2px rgba(252,211,77,0.5)",
              }}
            />
          ))}
      </div>

      {/* night: a gentle dusk over the whole page, not a blue box */}
      <div
        className={`pointer-events-none fixed inset-0 z-10 bg-indigo-950 mix-blend-multiply transition-opacity duration-1000 ${
          night ? "opacity-25" : "opacity-0"
        }`}
      />

      {/* room-change fade */}
      {leaving && (
        <div className="room-fade absolute inset-0 z-20 flex items-center justify-center bg-black">
          <span className="font-pixel text-lg text-amber-100">
            entering {leaving}…
          </span>
        </div>
      )}
    </div>
  );
}
