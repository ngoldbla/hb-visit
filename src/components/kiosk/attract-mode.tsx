"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";

interface AttractModeProps {
  onStartScan: () => void;
}

export function AttractMode({ onStartScan }: AttractModeProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-12 px-8">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="text-6xl font-bold text-[#000824] tracking-tight">
          HatchBridge
        </h1>
        <p className="text-2xl text-[#000824]/60 mt-2">Incubator</p>
      </motion.div>

      {/* Welcome message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-center"
      >
        <p className="text-4xl text-[#000824] font-light">
          Welcome! Ready to check in?
        </p>
      </motion.div>

      {/* Pulsing QR icon */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="my-8"
      >
        <div className="w-32 h-32 rounded-3xl bg-[#000824] flex items-center justify-center shadow-xl">
          <QrCode className="w-16 h-16 text-[#fff9e9]" />
        </div>
      </motion.div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="w-full max-w-md"
      >
        <Button
          onClick={onStartScan}
          className="w-full h-20 text-2xl font-semibold bg-[#2153ff] hover:bg-[#1a42cc] text-white rounded-2xl shadow-lg transition-all duration-200 active:scale-[0.98]"
        >
          Tap to Scan QR Code
        </Button>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="text-lg text-[#000824]/40 absolute bottom-8"
      >
        Show the QR code from your email or wallet
      </motion.p>
    </div>
  );
}
