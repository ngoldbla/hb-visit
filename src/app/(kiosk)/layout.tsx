import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "HatchBridge Check-In",
  description: "Welcome to HatchBridge",
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
