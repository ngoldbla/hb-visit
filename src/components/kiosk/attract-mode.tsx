"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { QrCode, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface AttractModeProps {
  onStartScan: () => void;
}

// The URL for NFC stickers and registration QR
// Uses NEXT_PUBLIC_SITE_URL for consistent branding, falls back to current origin
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
const REGISTRATION_URL = `${SITE_URL}/tap?loc=kiosk`;

export function AttractMode({ onStartScan }: AttractModeProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-8 px-8">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="text-5xl font-bold text-[#000824] tracking-tight">
          Welcome to HatchBridge
        </h1>
      </motion.div>

      {/* Two-column layout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex flex-col md:flex-row gap-8 md:gap-16 items-center justify-center w-full max-w-4xl"
      >
        {/* NFC Tap Zone */}
        <div className="flex-1 text-center">
          <motion.div
            animate={{
              scale: [1, 1.02, 1],
              boxShadow: [
                "0 0 0 0 rgba(33, 83, 255, 0.4)",
                "0 0 0 20px rgba(33, 83, 255, 0)",
                "0 0 0 0 rgba(33, 83, 255, 0)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-40 h-40 rounded-3xl bg-[#2153ff] flex items-center justify-center mx-auto shadow-xl"
          >
            <Smartphone className="w-20 h-20 text-white" />
          </motion.div>
          <h2 className="text-2xl font-semibold text-[#000824] mt-6">
            Tap Your Phone
          </h2>
          <p className="text-lg text-[#000824]/60 mt-2">
            on any check-in point
          </p>
          <p className="text-sm text-[#000824]/40 mt-1">
            Returning visitors: instant check-in
          </p>
        </div>

        {/* Divider */}
        <div className="hidden md:flex flex-col items-center gap-2">
          <div className="h-24 w-px bg-[#000824]/20" />
          <span className="text-[#000824]/40 font-medium">OR</span>
          <div className="h-24 w-px bg-[#000824]/20" />
        </div>
        <div className="md:hidden flex items-center gap-4 w-full max-w-xs">
          <div className="flex-1 h-px bg-[#000824]/20" />
          <span className="text-[#000824]/40 font-medium">OR</span>
          <div className="flex-1 h-px bg-[#000824]/20" />
        </div>

        {/* Registration QR Code */}
        <div className="flex-1 text-center">
          <div className="w-40 h-40 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-lg p-4">
            <QRCodeSVG
              value={REGISTRATION_URL}
              size={128}
              level="M"
              bgColor="transparent"
              fgColor="#000824"
            />
          </div>
          <h2 className="text-2xl font-semibold text-[#000824] mt-6">
            First Time?
          </h2>
          <p className="text-lg text-[#000824]/60 mt-2">
            Scan to register
          </p>
          <p className="text-sm text-[#000824]/40 mt-1">
            Quick setup for instant future visits
          </p>
        </div>
      </motion.div>

      {/* Fallback: Have a pass? */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-4"
      >
        <Button
          onClick={onStartScan}
          variant="outline"
          className="h-14 px-8 text-lg font-medium border-[#000824]/20 text-[#000824]/70 hover:bg-[#000824]/5 rounded-xl"
        >
          <QrCode className="w-5 h-5 mr-2" />
          Already have a QR pass? Tap to scan
        </Button>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="text-sm text-[#000824]/30 absolute bottom-6"
      >
        NFC check-in points are located throughout the building
      </motion.p>
    </div>
  );
}
