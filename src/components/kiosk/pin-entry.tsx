"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { NumericKeypad } from "./numeric-keypad";

const IDLE_TIMEOUT = 30_000;

interface PinEntryProps {
  memberName: string;
  memberEmoji: string | null;
  memberId: string;
  phone: string;
  onSuccess: (result: {
    visitorName: string;
    streak: number;
    monthlyCount: number;
    monthlyGoal: number;
  }) => void;
  onBack: () => void;
}

export function PinEntry({
  memberName,
  memberEmoji,
  phone,
  onSuccess,
  onBack,
}: PinEntryProps) {
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [shake, setShake] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockoutInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset idle timer
  const resetIdle = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => onBack(), IDLE_TIMEOUT);
  }, [onBack]);

  useEffect(() => {
    resetIdle();
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (lockoutInterval.current) clearInterval(lockoutInterval.current);
    };
  }, [resetIdle]);

  // Lockout countdown
  useEffect(() => {
    if (lockoutSeconds > 0) {
      lockoutInterval.current = setInterval(() => {
        setLockoutSeconds((s) => {
          if (s <= 1) {
            if (lockoutInterval.current) clearInterval(lockoutInterval.current);
            setError(null);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
      return () => {
        if (lockoutInterval.current) clearInterval(lockoutInterval.current);
      };
    }
  }, [lockoutSeconds]);

  const submitPin = useCallback(
    async (pinValue: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/kiosk/pin-checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, pin: pinValue }),
        });
        const data = await res.json();

        if (data.success) {
          onSuccess({
            visitorName: data.visitor_name,
            streak: data.streak,
            monthlyCount: data.monthly_count,
            monthlyGoal: 1000,
          });
          return;
        }

        // Handle errors
        setPin("");

        if (data.code === "locked") {
          setLockoutSeconds(data.lockout_remaining || 300);
          setError(`Too many attempts. Try again in ${Math.ceil((data.lockout_remaining || 300) / 60)} minutes.`);
        } else if (data.code === "wrong_pin") {
          setAttemptsRemaining(data.attempts_remaining);
          setError(`Incorrect PIN. ${data.attempts_remaining} attempt${data.attempts_remaining !== 1 ? "s" : ""} remaining.`);
          setShake(true);
          setTimeout(() => setShake(false), 500);
        } else {
          setError(data.error || "Something went wrong.");
        }
      } catch {
        setError("Something went wrong. Please try again.");
        setPin("");
      } finally {
        setIsLoading(false);
      }
    },
    [phone, onSuccess]
  );

  const handleDigit = useCallback(
    (digit: string) => {
      if (lockoutSeconds > 0) return;
      resetIdle();
      if (pin.length >= 4) return;
      const newPin = pin + digit;
      setPin(newPin);
      setError(null);

      // Auto-submit at 4 digits
      if (newPin.length === 4) {
        submitPin(newPin);
      }
    },
    [pin, lockoutSeconds, resetIdle, submitPin]
  );

  const handleDelete = useCallback(() => {
    resetIdle();
    setPin((p) => p.slice(0, -1));
    setError(null);
  }, [resetIdle]);

  const isLocked = lockoutSeconds > 0;
  const minutes = Math.floor(lockoutSeconds / 60);
  const seconds = lockoutSeconds % 60;

  return (
    <div className="h-full flex flex-col bg-[#fff9e9]">
      {/* Header */}
      <div className="px-8 py-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#333]/60 hover:text-[#333] transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="text-lg">Back</span>
        </button>
        <button
          onClick={onBack}
          className="text-[#2153ff] text-base hover:underline"
        >
          Not you?
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-8">
        {/* Personalized greeting */}
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#ffc421] to-[#ff9d00] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-4xl">{memberEmoji || "😊"}</span>
          </div>
          <h1 className="text-3xl font-bold text-[#000824] mb-2">
            Hi, {memberName}!
          </h1>
          <p className="text-[#333]/50 text-lg">
            Enter your 4-digit PIN
          </p>
        </div>

        {/* PIN dots */}
        <motion.div
          animate={shake ? { x: [-15, 15, -10, 10, -5, 5, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex gap-5"
        >
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: pin.length === i + 1 ? [1, 1.2, 1] : 1,
              }}
              transition={{ duration: 0.15 }}
              className={`w-5 h-5 rounded-full transition-colors ${
                i < pin.length
                  ? "bg-[#ffc421]"
                  : "bg-[#333]/15"
              }`}
            />
          ))}
        </motion.div>

        {/* Error / lockout message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 text-red-600 px-6 py-3 rounded-xl text-base text-center max-w-sm"
          >
            {isLocked ? (
              <>
                Too many attempts. Try again in{" "}
                <span className="font-mono font-bold">
                  {minutes}:{seconds.toString().padStart(2, "0")}
                </span>
              </>
            ) : (
              error
            )}
          </motion.div>
        )}

        {/* Keypad */}
        <NumericKeypad
          onDigit={handleDigit}
          onDelete={handleDelete}
          disabled={isLoading || isLocked || pin.length >= 4}
        />

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[#333]/50 text-lg"
          >
            Checking in...
          </motion.div>
        )}

        {/* Forgot PIN */}
        <p className="text-[#333]/40 text-sm">
          Forgot PIN? Ask staff at the front desk.
        </p>
      </div>
    </div>
  );
}
