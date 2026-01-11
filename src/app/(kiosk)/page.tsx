"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AttractMode } from "@/components/kiosk/attract-mode";
import { QRScanner } from "@/components/kiosk/qr-scanner";
import { SuccessScreen } from "@/components/kiosk/success-screen";
import { ErrorScreen } from "@/components/kiosk/error-screen";
import { createClient } from "@/lib/supabase/client";

type KioskState = "attract" | "scanning" | "processing" | "success" | "error" | "celebrating";

interface CheckInResult {
  visitorName: string;
  hostName?: string;
  meetingRoom?: string;
  checkInTime: Date;
  location?: string;
}

export default function KioskPage() {
  const [state, setState] = useState<KioskState>("attract");
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleStartScan = useCallback(() => {
    setState("scanning");
  }, []);

  const handleScanSuccess = useCallback(async (qrData: string) => {
    setState("processing");

    try {
      const response = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_data: qrData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Check-in failed");
      }

      setCheckInResult({
        visitorName: data.visitor_name,
        hostName: data.host_name,
        meetingRoom: data.meeting_room,
        checkInTime: new Date(),
      });
      setState("success");

      // Auto-reset after 5 seconds
      setTimeout(() => {
        setState("attract");
        setCheckInResult(null);
      }, 5000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
      setState("error");

      // Auto-reset after 10 seconds
      setTimeout(() => {
        setState("attract");
        setErrorMessage("");
      }, 10000);
    }
  }, []);

  const handleCancel = useCallback(() => {
    setState("attract");
  }, []);

  const handleRetry = useCallback(() => {
    setErrorMessage("");
    setState("scanning");
  }, []);

  // Subscribe to real-time check-ins from NFC taps
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("nfc-checkins")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "check_ins",
        },
        (payload) => {
          // Show celebration for NFC check-ins
          if (payload.new && payload.new.check_in_method?.startsWith("nfc")) {
            setCheckInResult({
              visitorName: payload.new.visitor_name || "Visitor",
              checkInTime: new Date(payload.new.check_in_time),
              location: payload.new.location,
            });
            setState("celebrating");

            // Return to attract mode after 5 seconds
            setTimeout(() => {
              setState("attract");
              setCheckInResult(null);
            }, 5000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="h-screen w-screen flex items-center justify-center p-8">
      <AnimatePresence mode="wait">
        {state === "attract" && (
          <motion.div
            key="attract"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <AttractMode onStartScan={handleStartScan} />
          </motion.div>
        )}

        {(state === "scanning" || state === "processing") && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <QRScanner
              onScanSuccess={handleScanSuccess}
              onCancel={handleCancel}
              isProcessing={state === "processing"}
            />
          </motion.div>
        )}

        {state === "success" && checkInResult && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <SuccessScreen
              visitorName={checkInResult.visitorName}
              hostName={checkInResult.hostName}
              meetingRoom={checkInResult.meetingRoom}
            />
          </motion.div>
        )}

        {state === "celebrating" && checkInResult && (
          <motion.div
            key="celebrating"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <SuccessScreen
              visitorName={checkInResult.visitorName}
              hostName={checkInResult.hostName}
              meetingRoom={checkInResult.meetingRoom}
            />
          </motion.div>
        )}

        {state === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <ErrorScreen
              message={errorMessage}
              onRetry={handleRetry}
              onCancel={handleCancel}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
