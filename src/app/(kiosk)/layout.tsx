import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "HatchBridge Check-In",
  description: "Welcome to HatchBridge",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HB Check-In",
  },
  icons: {
    apple: [
      { url: "/apple-icon-180x180.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-icon-152x152.png", sizes: "152x152", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function KioskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fff9e9] overflow-hidden touch-none select-none">
      {children}
    </div>
  );
}
