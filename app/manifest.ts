import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Same Page",
    short_name: "Same Page",
    description: "Read together — highlight, annotate, and share.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4ecd8",
    theme_color: "#788a4f",
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
