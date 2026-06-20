import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Same Page",
    short_name: "Same Page",
    description: "Read together — highlight, annotate, and share.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#fbbf24",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
