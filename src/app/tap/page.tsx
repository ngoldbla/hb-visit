"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { startAuthentication } from "@simplewebauthn/browser";
import { formatDisplayName } from "@/lib/utils";
import {
  unlockAudio,
  playMobileChime,
  triggerHapticSuccess,
} from "@/lib/audio";

type TapStatus = "checking" | "choice" | "authenticating" | "success" | "registering" | "error";

const STORAGE_KEY = "hb_visitor_token";

function TapPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const location = searchParams.get("loc") || "unknown";
  const activityParam = searchParams.get("activity") || null;

  const [status, setStatus] = useState<TapStatus>("checking");
  const [visitorName, setVisitorName] = useState<string>("");
  const [avatarEmoji, setAvatarEmoji] = useState<string>("😊");
  const [arrivalPosition, setArrivalPosition] = useState<number>(0);
  const [activityName, setActivityName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const checkInWithToken = useCallback(async (token: string) => {
    try {
      let checkinUrl = `/api/tap/checkin?loc=${encodeURIComponent(location)}`;
      if (activityParam) {
        checkinUrl += `&activity=${encodeURIComponent(activityParam)}`;
      }
      const response = await fetch(checkinUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Visitor-Token": token,
        },
      });

      const data = await response.json();

      if (data.success) {
        setVisitorName(data.visitor_name);
        setAvatarEmoji(data.avatar_emoji || "😊");

        // Haptic and audio feedback (fire and forget - don't block on audio)
        try {
          triggerHapticSuccess();
          unlockAudio().then(() => {
            playMobileChime();
          }).catch(() => {
            // Audio not available, ignore
          });
        } catch {
          // Haptic not available, continue
        }

        setArrivalPosition(data.arrival_position || 0);
        if (data.activity_name) {
          setActivityName(data.activity_name);
        }
        setStatus("success");

        return true;
      }

      return false;
    } catch {
      return false;
    }
  }, [location, activityParam]);

  const tryPasskeyAuth = useCallback(async () => {
    try {
      setStatus("authenticating");

      // Get authentication options (discoverable credentials)
      const optionsResponse = await fetch("/api/auth/passkey/authenticate");
      const optionsData = await optionsResponse.json();

      if (!optionsData.success) {
        return false;
      }

      // Trigger browser passkey authentication
      const authResponse = await startAuthentication({ optionsJSON: optionsData.options });

      // Verify with server
      const verifyResponse = await fetch("/api/auth/passkey/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: authResponse }),
      });

      const verifyData = await verifyResponse.json();

      if (verifyData.success && verifyData.token) {
        // Store the new token
        localStorage.setItem(STORAGE_KEY, verifyData.token);

        // Check in
        setVisitorName(verifyData.visitorName);

        // Create check-in record
        let passkeyCheckinUrl = `/api/tap/checkin?loc=${encodeURIComponent(location)}`;
        if (activityParam) {
          passkeyCheckinUrl += `&activity=${encodeURIComponent(activityParam)}`;
        }
        const checkinResp = await fetch(passkeyCheckinUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Visitor-Token": verifyData.token,
          },
        });
        const checkinData = await checkinResp.json();
        if (checkinData.activity_name) {
          setActivityName(checkinData.activity_name);
        }

        setStatus("success");

        // Haptic and audio feedback (fire and forget)
        try {
          triggerHapticSuccess();
          unlockAudio().then(() => {
            playMobileChime();
          }).catch(() => {});
        } catch {
          // Haptic not available, continue
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error("Passkey auth failed:", error);
      return false;
    }
  }, [location, activityParam]);

  useEffect(() => {
    async function handleTap() {
      // Stale tab: no loc parameter means the URL was already processed or user navigated directly
      // Just re-attempt check-in if they have a token
      if (location === "unknown") {
        const token = localStorage.getItem(STORAGE_KEY);
        if (token) {
          const success = await checkInWithToken(token);
          if (success) return;
        }
        // No token or invalid token, redirect to registration
        router.push("/tap/register");
        return;
      }

      // 1. Check for localStorage token
      const token = localStorage.getItem(STORAGE_KEY);

      if (token) {
        const success = await checkInWithToken(token);
        if (success) {
          return;
        }
        // Token invalid, clear it
        localStorage.removeItem(STORAGE_KEY);
      }

      // 2. No token - redirect directly to registration
      let registerUrl = `/tap/register?loc=${encodeURIComponent(location)}`;
      if (activityParam) {
        registerUrl += `&activity=${encodeURIComponent(activityParam)}`;
      }
      router.push(registerUrl);
    }

    handleTap();
  }, [checkInWithToken, router, location, activityParam]);

  // Auto-redirect to registration after a moment
  useEffect(() => {
    if (status === "registering") {
      const timer = setTimeout(() => {
        let regUrl = `/tap/register?loc=${encodeURIComponent(location)}`;
        if (activityParam) {
          regUrl += `&activity=${encodeURIComponent(activityParam)}`;
        }
        router.push(regUrl);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [status, router, location, activityParam]);

  return (
    <div className="min-h-screen bg-[#fff9e9] flex flex-col p-4">
      {/* Branded Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-6 pb-4 flex flex-col items-center"
      >
        <Image
          src="/hatchbridge-logo.svg"
          alt="HatchBridge"
          width={140}
          height={34}
          priority
        />
        <p className="text-[#000824]/50 text-sm mt-1">Incubator Check-In</p>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {status === "checking" && (
          <motion.div
            key="checking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <div className="w-16 h-16 border-4 border-[#2153ff] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#000824] text-lg">Checking in...</p>
          </motion.div>
        )}

        {status === "choice" && (
          <motion.div
            key="choice"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center max-w-sm"
          >
            <div className="w-20 h-20 bg-[#2153ff] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#000824] mb-2">
              Welcome to HatchBridge!
            </h1>
            <p className="text-[#000824]/60 mb-8">
              Quick check-in at {location}
            </p>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  try {
                    await unlockAudio();
                  } catch {
                    // Continue even if audio fails
                  }
                  tryPasskeyAuth();
                }}
                className="w-full bg-[#2153ff] text-white px-6 py-4 rounded-xl font-medium text-lg hover:bg-[#1a42cc] transition-colors"
              >
                I&apos;ve been here before
              </button>
              <button
                onClick={async () => {
                  try {
                    await unlockAudio();
                  } catch {
                    // Continue even if audio fails
                  }
                  let choiceRegUrl = `/tap/register?loc=${encodeURIComponent(location)}`;
                  if (activityParam) {
                    choiceRegUrl += `&activity=${encodeURIComponent(activityParam)}`;
                  }
                  router.push(choiceRegUrl);
                }}
                className="w-full bg-white text-[#000824] px-6 py-4 rounded-xl font-medium text-lg border-2 border-[#000824]/10 hover:border-[#2153ff] transition-colors"
              >
                First time? Register
              </button>
            </div>
          </motion.div>
        )}

        {status === "authenticating" && (
          <motion.div
            key="authenticating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-[#2153ff] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
            <p className="text-[#000824] text-lg">Verify with passkey</p>
            <p className="text-[#000824]/60 text-sm mt-1">to restore your check-in</p>
          </motion.div>
        )}

        {status === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="w-24 h-24 bg-gradient-to-br from-[#ffc421] to-[#ff9d00] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <span className="text-5xl leading-none">{avatarEmoji}</span>
            </motion.div>
            <h1 className="text-2xl font-bold text-[#000824] mb-2">
              Welcome back, {formatDisplayName(visitorName)}!
            </h1>
            <p className="text-[#000824]/60">
              {activityName
                ? `Checked in for ${activityName}`
                : "You're checked in"}
            </p>
            {arrivalPosition > 0 && (
              <p className="text-[#ffc421] font-semibold mt-2">
                #{arrivalPosition} to arrive today
              </p>
            )}
            <p className="text-[#000824]/40 text-sm mt-4">
              Location: {location}
            </p>
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={() => router.push("/stats")}
              className="mt-6 bg-[#000824] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#000824]/90 transition-colors"
            >
              View Your Stats
            </motion.button>
          </motion.div>
        )}

        {status === "registering" && (
          <motion.div
            key="registering"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <div className="w-16 h-16 border-4 border-[#2153ff] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#000824] text-lg">Setting up your check-in...</p>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center"
          >
            <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#000824] mb-2">
              Something went wrong
            </h1>
            <p className="text-[#000824]/60 mb-6">{errorMessage}</p>
            <button
              onClick={() => {
                let errRegUrl = `/tap/register?loc=${encodeURIComponent(location)}`;
                if (activityParam) {
                  errRegUrl += `&activity=${encodeURIComponent(activityParam)}`;
                }
                router.push(errRegUrl);
              }}
              className="bg-[#2153ff] text-white px-6 py-3 rounded-lg font-medium"
            >
              Register to Check In
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#fff9e9] flex flex-col p-4">
      {/* Branded Header */}
      <header className="pt-6 pb-4 flex flex-col items-center">
        <Image
          src="/hatchbridge-logo.svg"
          alt="HatchBridge"
          width={140}
          height={34}
          priority
        />
        <p className="text-[#000824]/50 text-sm mt-1">Incubator Check-In</p>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#2153ff] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#000824] text-lg">Loading...</p>
        </div>
      </div>
    </div>
  );
}

export default function TapPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TapPageContent />
    </Suspense>
  );
}
