"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Nfc, Lock, AlertCircle, Smartphone, BarChart3 } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function MobileExplainer() {
  const [showAdminAccess, setShowAdminAccess] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/admin");
        router.refresh();
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-8 pb-4 flex flex-col items-center"
      >
        <Image
          src="/hatchbridge-logo.svg"
          alt="HatchBridge"
          width={160}
          height={38}
          priority
        />
        <p className="text-gray-500 text-sm mt-2">Incubator Check-In</p>
      </motion.header>

      {/* Main content */}
      <div className="flex-1 px-6 py-4 flex flex-col">
        {/* Explainer section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg shadow-black/5 border border-black/5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Mobile Device Detected</h2>
              <p className="text-gray-500 text-sm">This kiosk is designed for iPad</p>
            </div>
          </div>

          <div className="space-y-4 mt-6">
            {/* NFC Check-in explanation */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Nfc className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Tap to Check In</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Use your phone to tap any NFC checkpoint in the building. Your personal stats and streak will be saved to your device.
                </p>
              </div>
            </div>

            {/* Personal stats explanation */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Track Your Visits</h3>
                <p className="text-gray-600 text-sm mt-1">
                  After tapping in, you&apos;ll see your personal check-in history, current streak, and visit stats tied to your device.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Admin access section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 bg-white rounded-2xl p-6 shadow-lg shadow-black/5 border border-black/5"
        >
          {!showAdminAccess ? (
            <button
              onClick={() => setShowAdminAccess(true)}
              className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 transition-colors py-2"
            >
              <Lock className="w-4 h-4" />
              <span className="text-sm">Admin Access</span>
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-gray-700" />
                <h3 className="font-semibold text-gray-900">Admin Dashboard</h3>
              </div>
              <form onSubmit={handleAdminLogin} className="space-y-3">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  autoFocus
                />
                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAdminAccess(false);
                      setPassword("");
                      setError("");
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Checking..." : "Access"}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </motion.div>

        {/* NFC instruction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-auto pt-8 pb-4 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-800">
            <Nfc className="w-4 h-4" />
            <span className="text-sm font-medium">Find an NFC checkpoint to tap in</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
