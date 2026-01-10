"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScanSuccess: (data: string) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export function QRScanner({
  onScanSuccess,
  onCancel,
  isProcessing,
}: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [hasScanned, setHasScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 300, height: 300 },
          aspectRatio: 1,
        },
        (decodedText) => {
          if (!hasScanned) {
            setHasScanned(true);
            onScanSuccess(decodedText);
          }
        },
        () => {
          // QR code not detected - this is called frequently, ignore
        }
      )
      .catch((err) => {
        console.error("Camera error:", err);
        setError("Unable to access camera. Please check permissions.");
      });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [onScanSuccess, hasScanned]);

  if (isProcessing) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-24 h-24 text-[#2153ff]" />
        </motion.div>
        <p className="text-3xl text-[#000824] font-light">Checking you in...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-8 px-8">
        <p className="text-2xl text-red-600 text-center">{error}</p>
        <Button
          onClick={onCancel}
          variant="outline"
          className="h-14 px-8 text-lg"
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-between py-8 px-8">
      {/* Header */}
      <div className="w-full flex justify-between items-center">
        <h2 className="text-3xl font-semibold text-[#000824]">Scan QR Code</h2>
        <Button
          onClick={onCancel}
          variant="ghost"
          size="icon"
          className="h-14 w-14 rounded-full"
        >
          <X className="w-8 h-8" />
        </Button>
      </div>

      {/* Camera view */}
      <div className="flex-1 flex items-center justify-center w-full max-w-lg my-8">
        <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-black shadow-2xl">
          <div id="qr-reader" className="w-full h-full" />

          {/* Scan frame overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-64 h-64 border-4 border-[#2153ff] rounded-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <p className="text-xl text-[#000824]/60 text-center">
        Position the QR code from your email or wallet in the frame
      </p>
    </div>
  );
}
