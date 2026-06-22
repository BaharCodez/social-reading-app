// Tiny original pixel-art potted plants, drawn as crisp SVG squares so they
// stay sharp at any size and match the cozy plant-shop palette.

const C: Record<string, string> = {
  g: "#6f8f4f", // leaf
  l: "#8aa85f", // leaf highlight
  d: "#57733d", // leaf dark / stem
  p: "#b5683f", // terracotta pot
  k: "#8a4f2e", // pot shadow / rim
  f: "#cf8aa0", // flower
  y: "#e0a64e", // flower centre
};

// [x, y, w, h, colorKey] on a 12×16 grid.
type Px = [number, number, number, number, string];

const VARIANTS: Px[][] = [
  // leafy bush
  [
    [4, 2, 5, 1, "g"],
    [3, 3, 7, 1, "g"],
    [3, 4, 7, 1, "g"],
    [4, 5, 5, 1, "g"],
    [5, 6, 3, 1, "g"],
    [4, 3, 1, 1, "l"],
    [6, 2, 1, 1, "l"],
    [8, 4, 1, 1, "l"],
    [6, 7, 1, 2, "d"],
    [3, 9, 7, 1, "k"],
    [4, 10, 5, 3, "p"],
    [8, 10, 1, 3, "k"],
    [5, 13, 3, 1, "k"],
  ],
  // cactus
  [
    [5, 3, 2, 7, "g"],
    [3, 4, 1, 3, "g"],
    [4, 5, 1, 2, "g"],
    [8, 4, 1, 3, "g"],
    [7, 5, 1, 2, "g"],
    [5, 3, 1, 4, "l"],
    [5, 2, 1, 1, "f"],
    [6, 2, 1, 1, "f"],
    [3, 10, 6, 1, "k"],
    [4, 11, 4, 2, "p"],
    [5, 13, 2, 1, "k"],
  ],
  // flower
  [
    [6, 4, 1, 5, "d"],
    [5, 6, 1, 1, "g"],
    [7, 6, 1, 1, "g"],
    [4, 7, 1, 1, "g"],
    [5, 2, 3, 1, "f"],
    [5, 3, 1, 1, "f"],
    [7, 3, 1, 1, "f"],
    [5, 4, 3, 1, "f"],
    [6, 3, 1, 1, "y"],
    [4, 9, 5, 1, "k"],
    [5, 10, 3, 3, "p"],
    [7, 10, 1, 3, "k"],
    [6, 13, 1, 1, "k"],
  ],
];

export default function PixelPlant({
  variant = 0,
  className = "",
}: {
  variant?: number;
  className?: string;
}) {
  const pixels = VARIANTS[variant % VARIANTS.length];
  return (
    <svg
      viewBox="0 0 12 16"
      className={className}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {pixels.map(([x, y, w, h, c], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={C[c]} />
      ))}
    </svg>
  );
}
