import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HatchBridge Check-In",
    short_name: "HB Check-In",
    description: "HatchBridge visitor check-in kiosk",
    start_url: "/",
    display: "standalone",
    orientation: "landscape",
    background_color: "#fff9e9",
    theme_color: "#ffc421",
    icons: [
      {
        src: "/apple-icon-180x180.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/apple-icon-152x152.png",
        sizes: "152x152",
        type: "image/png",
      },
    ],
  };
}
