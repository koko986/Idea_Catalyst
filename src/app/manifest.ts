import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PyanThit Second-Hand Marketplace",
    short_name: "PyanThit",
    description: "Buy and sell second-hand goods with identity, escrow, and handover protection.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7f2",
    theme_color: "#145c3f",
    icons: [
      { src: "/pyanthit-icon.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
