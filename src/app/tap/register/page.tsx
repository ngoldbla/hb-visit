"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { startRegistration } from "@simplewebauthn/browser";

const STORAGE_KEY = "hb_visitor_token";

type RegistrationStep = "form" | "passkey" | "success" | "error";

// Curated emoji options for avatars - fun and expressive
const AVATAR_EMOJIS = [
  "😊", "😎", "🚀", "💡", "🔥", "⭐", "🎯", "💪",
  "🌟", "🎨", "📚", "💻", "🎵", "☕", "🌈", "🦄",
  "🐱", "🐶", "🦊", "🐼", "🦁", "🐸", "🦋", "🌻",
];

function EmojiPicker({ selected, onSelect }: { selected: string; onSelect: (emoji: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#000824]">
        Pick your avatar
      </label>
      <div className="grid grid-cols-8 gap-2">
        {AVATAR_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            className={`w-10 h-10 text-xl rounded-lg transition-all ${
              selected === emoji
                ? "bg-[#ffc421] ring-2 ring-[#ff9d00] scale-110"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

function RegisterPageContent() {
  const searchParams = useSearchParams();
  const location = searchParams.get("loc") || "unknown";

  const [step, setStep] = useState<RegistrationStep>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState("😊");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      setErrorMessage("Name and email are required");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // Step 1: Create device token and member record
      const tokenResponse = await fetch("/api/tap/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          company: company.trim() || null,
          avatarEmoji,
          location,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenData.success) {
        setErrorMessage(tokenData.error || "Registration failed");
        setIsSubmitting(false);
        return;
      }

      // Store the token
      localStorage.setItem(STORAGE_KEY, tokenData.token);

      // Step 2: Try to register passkey
      setStep("passkey");

      try {
        // Get passkey registration options
        const optionsResponse = await fetch(
          `/api/auth/passkey/register?email=${encodeURIComponent(email.trim())}&name=${encodeURIComponent(name.trim())}`
        );
        const optionsData = await optionsResponse.json();

        if (optionsData.success) {
          // Create passkey
          const regResponse = await startRegistration({ optionsJSON: optionsData.options });

          // Verify with server
          await fetch("/api/auth/passkey/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email.trim(),
              response: regResponse,
            }),
          });
        }
      } catch (passkeyError) {
        // Passkey creation failed, but we still have the token
        console.log("Passkey creation skipped:", passkeyError);
      }

      // Step 3: Create check-in
      await fetch(`/api/tap/checkin?loc=${encodeURIComponent(location)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Visitor-Token": tokenData.token,
        },
      });

      setStep("success");
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage("Something went wrong. Please try again.");
      setStep("error");
    } finally {
      setIsSubmitting(false);
    }
  }, [name, email, phone, company, avatarEmoji, location]);

  return (
    <div className="min-h-screen bg-[#fff9e9] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {step === "form" && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-[#000824]">
                Welcome to HatchBridge
              </h1>
              <p className="text-[#000824]/60 mt-1">
                Quick check-in to get started
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#000824] mb-1">
                  Your Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2153ff] focus:border-transparent"
                />
              </div>

              <EmojiPicker selected={avatarEmoji} onSelect={setAvatarEmoji} />

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#000824] mb-1">
                  Email Address *
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2153ff] focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[#000824] mb-1">
                  Phone (optional)
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2153ff] focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-[#000824] mb-1">
                  Company (optional)
                </label>
                <input
                  id="company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Inc."
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2153ff] focus:border-transparent"
                />
              </div>

              {errorMessage && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#2153ff] text-white py-4 rounded-lg font-semibold text-lg hover:bg-[#1a42cc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Checking in..." : "Check In"}
              </button>
            </form>

            <p className="text-center text-sm text-[#000824]/40 mt-4">
              Your next visit will be instant
            </p>
          </div>
        )}

        {step === "passkey" && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-20 h-20 bg-[#2153ff] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#000824] mb-2">
              Setting up instant check-in
            </h2>
            <p className="text-[#000824]/60">
              Confirm with Face ID to enable one-tap check-in for future visits
            </p>
          </div>
        )}

        {step === "success" && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
              className="w-24 h-24 bg-gradient-to-br from-[#ffc421] to-[#ff9d00] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <span className="text-5xl">{avatarEmoji}</span>
            </motion.div>
            <h1 className="text-2xl font-bold text-[#000824] mb-2">
              Welcome, {name}!
            </h1>
            <p className="text-[#000824]/60 mb-2">You&apos;re checked in</p>
            <p className="text-[#000824]/40 text-sm">
              Next time, just tap to check in instantly
            </p>
          </div>
        )}

        {step === "error" && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
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
              onClick={() => setStep("form")}
              className="bg-[#2153ff] text-white px-6 py-3 rounded-lg font-medium"
            >
              Try Again
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#fff9e9] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#2153ff] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#000824] text-lg">Loading...</p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RegisterPageContent />
    </Suspense>
  );
}
