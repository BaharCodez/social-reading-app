import type { Metadata } from "next";
import RoomShell from "@/app/components/RoomShell";

export const metadata: Metadata = {
  title: "the workshop — bahar's house",
  description: "Mission control for the ESP32 on the workbench.",
};

/* Mission-control interior: a bento of telemetry tiles. Everything renders
   in its "no device yet" state — the tiles are laid out and labelled so
   wiring the real ESP32 in later is just swapping placeholders for data. */

function Tile({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`pixel-frame bg-surface flex flex-col gap-2 p-4 ${className}`}
    >
      <span className="font-pixel text-ink-soft text-xs tracking-wider uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

export default function WorkshopPage() {
  return (
    <RoomShell
      title="the workshop"
      tagline="mission control for the esp32 on the workbench"
    >
      <div className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-4 px-4 pb-10 sm:grid-cols-3 sm:gap-5 sm:px-6">
        <Tile label="device">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-zinc-400" />
            <span className="text-ink font-mono text-sm">esp32-devkit</span>
          </div>
          <span className="text-ink-soft font-mono text-xs">
            last seen: never
          </span>
        </Tile>

        <Tile label="led">
          <button
            disabled
            className="border-line text-ink-soft font-pixel cursor-not-allowed rounded border-2 px-3 py-2 text-sm opacity-60"
            title="Wired up once the board comes online"
          >
            toggle
          </button>
          <span className="text-ink-soft font-mono text-xs">
            waiting for hardware
          </span>
        </Tile>

        <Tile label="temperature" className="col-span-2 sm:col-span-1">
          <span className="text-ink font-mono text-3xl">--.-°C</span>
          <span className="text-ink-soft font-mono text-xs">no sensor yet</span>
        </Tile>

        <Tile label="console" className="col-span-2 sm:col-span-3">
          <div className="font-mono text-sm leading-relaxed">
            <p className="text-ink-soft">
              &gt; waiting for the board to phone home…
            </p>
            <p className="text-ink">
              &gt; <span className="animate-pulse">▮</span>
            </p>
          </div>
        </Tile>
      </div>

      <p className="text-ink-soft mx-auto max-w-md px-6 pb-10 text-center text-sm leading-relaxed">
        This panel will talk to the real board over the network — first
        project: the plant waterer. Until then, the workbench is set up and
        the soldering iron is warm.
      </p>
    </RoomShell>
  );
}
