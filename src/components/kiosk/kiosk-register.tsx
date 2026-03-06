"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, Phone, Lock, Smile } from "lucide-react";
import { NumericKeypad } from "./numeric-keypad";
import { KioskKeyboard } from "./kiosk-keyboard";
import { formatPhoneDisplay } from "@/lib/phone/normalize";
import { validateName } from "@/lib/validation/name-moderation";

const IDLE_TIMEOUT = 30_000;

const AVATAR_EMOJIS = [
  "😊", "😎", "🚀", "💡", "🔥", "⭐", "🎯", "💪",
  "🌟", "🎨", "📚", "💻", "🎵", "☕", "🌈", "🦄",
  "🐱", "🐶", "🦊", "🐼", "🦁", "🐸", "🦋", "🌻",
];

type RegisterStep = "name" | "phone" | "pin" | "avatar";

interface KioskRegisterProps {
  /** Pre-filled phone digits from the phone entry screen (if user came from "not found") */
  initialPhone?: string;
  onSuccess: (result: {
    visitorName: string;
    streak: number;
    monthlyCount: number;
    monthlyGoal: number;
  }) => void;
  onBack: () => void;
}

const STEPS: { key: RegisterStep; icon: typeof User; label: string }[] = [
  { key: "name", icon: User, label: "Name" },
  { key: "phone", icon: Phone, label: "Phone" },
  { key: "pin", icon: Lock, label: "PIN" },
  { key: "avatar", icon: Smile, label: "Avatar" },
];

export function KioskRegister({ initialPhone, onSuccess, onBack }: KioskRegisterProps) {
  const [step, setStep] = useState<RegisterStep>(initialPhone ? "name" : "name");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(initialPhone || "");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [isConfirmingPin, setIsConfirmingPin] = useState(false);
  const [avatar, setAvatar] = useState("😊");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  const handleStepBack = useCallback(() => {
    resetIdle();
    setError(null);
    if (step === "name") {
      onBack();
    } else if (step === "phone") {
      setStep("name");
    } else if (step === "pin") {
      if (isConfirmingPin) {
        setPinConfirm("");
        setIsConfirmingPin(false);
      } else {
        setStep("phone");
      }
    } else if (step === "avatar") {
      setStep("pin");
    }
  }, [step, isConfirmingPin, onBack, resetIdle]);

  // --- Name Step ---
  const handleNameChar = useCallback(
    (char: string) => {
      resetIdle();
      setName((n) => n + char);
      setError(null);
    },
    [resetIdle]
  );

  const handleNameDelete = useCallback(() => {
    resetIdle();
    setName((n) => n.slice(0, -1));
    setError(null);
  }, [resetIdle]);

  const handleNameDone = useCallback(() => {
    resetIdle();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name");
      return;
    }
    const validation = validateName(trimmed);
    if (!validation.isValid) {
      setError(validation.userMessage || "Please enter a valid name");
      return;
    }
    setError(null);
    setStep("phone");
  }, [name, resetIdle]);

  // --- Phone Step ---
  const handlePhoneDigit = useCallback(
    (digit: string) => {
      resetIdle();
      if (phone.length >= 10) return;
      setPhone((p) => p + digit);
      setError(null);
    },
    [phone, resetIdle]
  );

  const handlePhoneDelete = useCallback(() => {
    resetIdle();
    setPhone((p) => p.slice(0, -1));
    setError(null);
  }, [resetIdle]);

  const handlePhoneSubmit = useCallback(() => {
    resetIdle();
    if (phone.length !== 10) {
      setError("Please enter a 10-digit phone number");
      return;
    }
    setError(null);
    setStep("pin");
  }, [phone, resetIdle]);

  // --- PIN Step ---
  const handlePinDigit = useCallback(
    (digit: string) => {
      resetIdle();
      setError(null);

      if (!isConfirmingPin) {
        if (pin.length >= 4) return;
        const newPin = pin + digit;
        setPin(newPin);
        if (newPin.length === 4) {
          // Move to confirm
          setTimeout(() => setIsConfirmingPin(true), 300);
        }
      } else {
        if (pinConfirm.length >= 4) return;
        const newConfirm = pinConfirm + digit;
        setPinConfirm(newConfirm);
        if (newConfirm.length === 4) {
          // Verify match
          if (newConfirm !== pin) {
            setError("PINs don't match. Try again.");
            setPin("");
            setPinConfirm("");
            setIsConfirmingPin(false);
          } else {
            setError(null);
            setStep("avatar");
          }
        }
      }
    },
    [pin, pinConfirm, isConfirmingPin, resetIdle]
  );

  const handlePinDelete = useCallback(() => {
    resetIdle();
    setError(null);
    if (isConfirmingPin) {
      setPinConfirm((p) => p.slice(0, -1));
    } else {
      setPin((p) => p.slice(0, -1));
    }
  }, [isConfirmingPin, resetIdle]);

  // --- Avatar & Submit ---
  const handleSubmit = useCallback(async () => {
    resetIdle();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/kiosk/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          pin,
          avatar_emoji: avatar,
        }),
      });
      const data = await res.json();

      if (data.success) {
        onSuccess({
          visitorName: data.visitor_name,
          streak: data.streak,
          monthlyCount: data.monthly_count,
          monthlyGoal: 1000,
        });
      } else {
        setError(data.error || "Registration failed. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [name, phone, pin, avatar, onSuccess, resetIdle]);

  const currentPin = isConfirmingPin ? pinConfirm : pin;

  return (
    <div className="h-full flex flex-col bg-[#fff9e9]">
      {/* Header */}
      <div className="px-8 py-6 flex items-center justify-between">
        <button
          onClick={handleStepBack}
          className="flex items-center gap-2 text-[#333]/60 hover:text-[#333] transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="text-lg">Back</span>
        </button>

        {/* Progress indicator */}
        <div className="flex items-center gap-3">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  i < currentStepIndex
                    ? "bg-[#ffc421] text-[#000824]"
                    : i === currentStepIndex
                      ? "bg-[#000824] text-white"
                      : "bg-gray-200 text-[#333]/40"
                }`}
              >
                {i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-6 h-0.5 ${
                    i < currentStepIndex ? "bg-[#ffc421]" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          {/* === NAME STEP === */}
          {step === "name" && (
            <motion.div
              key="name"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="w-full flex flex-col items-center gap-6"
            >
              <div className="text-center">
                <h1 className="text-3xl font-bold text-[#000824] mb-2">
                  What&apos;s your name?
                </h1>
                <p className="text-[#333]/50 text-lg">
                  This is how we&apos;ll greet you
                </p>
              </div>

              {/* Name display */}
              <div className="w-full max-w-[500px] bg-white rounded-2xl px-8 py-5 text-center shadow-sm border border-black/5">
                <span className="text-3xl font-semibold text-[#000824]">
                  {name || <span className="text-[#333]/20">Your Name</span>}
                </span>
                <span className="inline-block w-0.5 h-8 bg-[#2153ff] ml-1 animate-pulse align-middle" />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-6 py-3 rounded-xl text-base">
                  {error}
                </div>
              )}

              <KioskKeyboard
                onChar={handleNameChar}
                onDelete={handleNameDelete}
                onDone={handleNameDone}
                disabled={false}
              />
            </motion.div>
          )}

          {/* === PHONE STEP === */}
          {step === "phone" && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="w-full flex flex-col items-center gap-6"
            >
              <div className="text-center">
                <h1 className="text-3xl font-bold text-[#000824] mb-2">
                  Your Phone Number
                </h1>
                <p className="text-[#333]/50 text-lg">
                  Used for quick kiosk check-in
                </p>
              </div>

              <div className="text-4xl font-mono font-bold text-[#000824] h-14 flex items-center justify-center tracking-wider">
                {phone.length > 0 ? formatPhoneDisplay(phone) : (
                  <span className="text-[#333]/20">(555) 123-4567</span>
                )}
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-6 py-3 rounded-xl text-base">
                  {error}
                </div>
              )}

              <NumericKeypad
                onDigit={handlePhoneDigit}
                onDelete={handlePhoneDelete}
                onSubmit={handlePhoneSubmit}
                showSubmit={phone.length === 10}
                submitLabel="Next"
                disabled={false}
              />
            </motion.div>
          )}

          {/* === PIN STEP === */}
          {step === "pin" && (
            <motion.div
              key="pin"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="w-full flex flex-col items-center gap-6"
            >
              <div className="text-center">
                <h1 className="text-3xl font-bold text-[#000824] mb-2">
                  {isConfirmingPin ? "Confirm Your PIN" : "Choose a 4-Digit PIN"}
                </h1>
                <p className="text-[#333]/50 text-lg">
                  {isConfirmingPin
                    ? "Enter the same PIN again"
                    : "You'll use this to check in at the kiosk"}
                </p>
              </div>

              {/* PIN dots */}
              <div className="flex gap-5">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: currentPin.length === i + 1 ? [1, 1.2, 1] : 1,
                    }}
                    transition={{ duration: 0.15 }}
                    className={`w-5 h-5 rounded-full transition-colors ${
                      i < currentPin.length
                        ? "bg-[#ffc421]"
                        : "bg-[#333]/15"
                    }`}
                  />
                ))}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 text-red-600 px-6 py-3 rounded-xl text-base"
                >
                  {error}
                </motion.div>
              )}

              <NumericKeypad
                onDigit={handlePinDigit}
                onDelete={handlePinDelete}
                disabled={currentPin.length >= 4}
              />
            </motion.div>
          )}

          {/* === AVATAR STEP === */}
          {step === "avatar" && (
            <motion.div
              key="avatar"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="w-full flex flex-col items-center gap-6"
            >
              <div className="text-center">
                <h1 className="text-3xl font-bold text-[#000824] mb-2">
                  Pick Your Avatar
                </h1>
                <p className="text-[#333]/50 text-lg">
                  This will appear next to your name
                </p>
              </div>

              {/* Selected avatar preview */}
              <div className="w-24 h-24 bg-gradient-to-br from-[#ffc421] to-[#ff9d00] rounded-full flex items-center justify-center shadow-lg">
                <span className="text-5xl">{avatar}</span>
              </div>

              {/* Emoji grid */}
              <div className="grid grid-cols-8 gap-3 max-w-[500px]">
                {AVATAR_EMOJIS.map((emoji) => (
                  <motion.button
                    key={emoji}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      resetIdle();
                      setAvatar(emoji);
                    }}
                    className={`w-14 h-14 text-2xl rounded-xl transition-all flex items-center justify-center ${
                      avatar === emoji
                        ? "bg-[#ffc421] ring-2 ring-[#ff9d00] scale-110"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-6 py-3 rounded-xl text-base">
                  {error}
                </div>
              )}

              {/* Submit button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full max-w-[400px] bg-[#ffc421] text-[#000824] py-4 rounded-2xl font-bold text-xl transition-colors hover:bg-[#ff9d00] disabled:opacity-50"
              >
                {isSubmitting ? "Creating your account..." : "Complete Registration"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
