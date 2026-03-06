"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Phone } from "lucide-react";
import { NumericKeypad } from "./numeric-keypad";
import { formatPhoneDisplay } from "@/lib/phone/normalize";

const IDLE_TIMEOUT = 30_000;

interface PhoneLookupResult {
  found: true;
  name: string;
  avatar_emoji: string | null;
  member_id: string;
  phone: string;
}

interface PhoneEntryProps {
  onFound: (data: PhoneLookupResult) => void;
  onNotFound: (phone: string) => void;
  onBack: () => void;
}

export function PhoneEntry({ onFound, onNotFound, onBack }: PhoneEntryProps) {
  const [digits, setDigits] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset idle timer on any interaction
  const resetIdle = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => onBack(), IDLE_TIMEOUT);
  }, [onBack]);

  useEffect(() => {
    resetIdle();
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [resetIdle]);

  const lookupPhone = useCallback(
    async (phoneDigits: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/kiosk/phone-lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phoneDigits }),
        });
        const data = await res.json();

        if (data.found) {
          onFound({ ...data, phone: phoneDigits } as PhoneLookupResult);
        } else {
          onNotFound(phoneDigits);
        }
      } catch {
        setError("Something went wrong. Please try again.");
        setIsLoading(false);
      }
    },
    [onFound, onNotFound]
  );

  const handleDigit = useCallback(
    (digit: string) => {
      resetIdle();
      if (digits.length >= 10) return;
      const newDigits = digits + digit;
      setDigits(newDigits);
      setError(null);

      // Auto-submit at 10 digits
      if (newDigits.length === 10) {
        lookupPhone(newDigits);
      }
    },
    [digits, resetIdle, lookupPhone]
  );

  const handleDelete = useCallback(() => {
    resetIdle();
    setDigits((d) => d.slice(0, -1));
    setError(null);
  }, [resetIdle]);

  return (
    <div className="h-full flex flex-col bg-[#fff9e9]">
      {/* Header */}
      <div className="px-8 py-6 flex items-center">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#333]/60 hover:text-[#333] transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="text-lg">Back</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#ffc421]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-[#ff9d00]" />
          </div>
          <h1 className="text-3xl font-bold text-[#000824] mb-2">
            Enter Your Phone Number
          </h1>
          <p className="text-[#333]/50 text-lg">
            The number you registered with
          </p>
        </div>

        {/* Phone display */}
        <div className="w-full max-w-[400px] text-center">
          <div className="text-4xl font-mono font-bold text-[#000824] h-14 flex items-center justify-center tracking-wider">
            {digits.length > 0 ? formatPhoneDisplay(digits) : (
              <span className="text-[#333]/20">(555) 123-4567</span>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 text-red-600 px-6 py-3 rounded-xl text-base"
          >
            {error}
          </motion.div>
        )}

        {/* Keypad */}
        <NumericKeypad
          onDigit={handleDigit}
          onDelete={handleDelete}
          disabled={isLoading || digits.length >= 10}
        />

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[#333]/50 text-lg"
          >
            Looking up your number...
          </motion.div>
        )}

        {/* Register link */}
        <button
          onClick={() => onNotFound("")}
          className="text-[#2153ff] text-base hover:underline mt-2"
        >
          First time? Register here
        </button>
      </div>
    </div>
  );
}
