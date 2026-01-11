"use client";

import { motion } from "framer-motion";
import { Nfc, Flame, Users, TrendingUp } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Image from "next/image";

// The URL for NFC stickers and registration QR
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
const REGISTRATION_URL = `${SITE_URL}/tap?loc=kiosk`;

interface CommunityStats {
  monthlyCount: number;
  monthlyGoal: number;
  recentCheckIns: Array<{ name: string; time: string }>;
  topStreak: number;
}

interface AttractModeProps {
  stats?: CommunityStats;
}

// Animated counter component
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="tabular-nums"
    >
      {value.toLocaleString()}{suffix}
    </motion.span>
  );
}

// Floating particles background - golden yellow theme
function ParticleBackground() {
  const particles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 6 + 3,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[#ffc421]/30"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Progress ring component - yellow/gold gradient
function ProgressRing({ progress, size = 200 }: { progress: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(0,0,0,0.08)"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#progressGradientYellow)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{
          strokeDasharray: circumference,
        }}
      />
      <defs>
        <linearGradient id="progressGradientYellow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffc421" />
          <stop offset="100%" stopColor="#ff9d00" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function AttractMode({ stats }: AttractModeProps) {
  const monthlyCount = stats?.monthlyCount ?? 0;
  const monthlyGoal = stats?.monthlyGoal ?? 1000;
  const progress = Math.min((monthlyCount / monthlyGoal) * 100, 100);
  const recentCheckIns = stats?.recentCheckIns ?? [];
  const topStreak = stats?.topStreak ?? 0;

  return (
    <div className="h-full bg-[#fff9e9] flex flex-col relative overflow-hidden">
      <ParticleBackground />

      {/* Header with official logo */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-8 pb-4 flex flex-col items-center relative z-10"
      >
        <Image
          src="/hatchbridge-logo.svg"
          alt="HatchBridge"
          width={200}
          height={48}
          priority
        />
        <p className="text-[#333]/60 text-lg mt-2 font-medium">Incubator Check-In</p>
      </motion.header>

      {/* Main content grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 px-8 pb-8 relative z-10">

        {/* Left column - Community Goal */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 flex flex-col items-center justify-center shadow-lg shadow-black/5 border border-black/5"
        >
          <div className="relative">
            <ProgressRing progress={progress} size={180} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-[#000824]">
                <AnimatedCounter value={monthlyCount} />
              </span>
              <span className="text-[#333]/50 text-sm">check-ins</span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-[#333]/70 text-lg">
              Help us reach <span className="text-[#000824] font-bold">{monthlyGoal.toLocaleString()}</span> this month!
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Users className="w-5 h-5 text-[#ffc421]" />
              <span className="text-[#333]/50">
                {Math.round(progress)}% of goal
              </span>
            </div>
          </div>

          {/* Streak highlight */}
          {topStreak > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 bg-gradient-to-r from-[#ffc421]/20 to-orange-400/20 rounded-full px-5 py-3 border border-[#ffc421]/40"
            >
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-[#333]/80 text-sm">
                  Someone is on a <span className="text-orange-500 font-bold">{topStreak}-day</span> streak!
                </span>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Center column - Check-in options */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center justify-center gap-8"
        >
          {/* NFC Tap Zone */}
          <div className="text-center">
            <motion.div
              animate={{
                scale: [1, 1.03, 1],
                boxShadow: [
                  "0 8px 32px rgba(255, 196, 33, 0.3)",
                  "0 12px 48px rgba(255, 196, 33, 0.5)",
                  "0 8px 32px rgba(255, 196, 33, 0.3)",
                ],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-40 h-40 rounded-[2rem] bg-gradient-to-br from-[#ffc421] to-[#ffaa00] flex items-center justify-center mx-auto border-4 border-white"
            >
              <Nfc className="w-20 h-20 text-[#000824]" />
            </motion.div>
            <h2 className="text-3xl font-bold text-[#000824] mt-6">
              Tap a Checkpoint
            </h2>
            <p className="text-[#333]/50 text-lg mt-2">
              Use your phone at any NFC point
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 w-full max-w-xs">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#333]/20 to-transparent" />
            <span className="text-[#333]/30 font-medium text-sm uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#333]/20 to-transparent" />
          </div>

          {/* Registration QR Code */}
          <div className="text-center">
            <motion.div
              animate={{
                borderColor: ["rgba(0,0,0,0.1)", "rgba(255,196,33,0.6)", "rgba(0,0,0,0.1)"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-36 h-36 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-black/10 p-3 border-2"
            >
              <QRCodeSVG
                value={REGISTRATION_URL}
                size={120}
                level="M"
                bgColor="transparent"
                fgColor="#000824"
              />
            </motion.div>
            <h3 className="text-xl font-semibold text-[#333]/80 mt-4">
              First Time?
            </h3>
            <p className="text-[#333]/40 mt-1">
              Scan to register
            </p>
          </div>
        </motion.div>

        {/* Right column - Activity Feed */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl p-6 shadow-lg shadow-black/5 border border-black/5 flex flex-col"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#ffc421]" />
            <h3 className="text-[#333]/70 font-semibold">Recent Activity</h3>
          </div>

          <div className="flex-1 space-y-3 overflow-hidden">
            {recentCheckIns.length > 0 ? (
              recentCheckIns.slice(0, 8).map((checkIn, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-3 bg-[#fff9e9] rounded-xl px-4 py-3"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ffc421] to-[#ff9d00] flex items-center justify-center text-[#000824] font-bold text-sm">
                    {checkIn.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#000824] font-medium truncate">
                      {checkIn.name}
                    </p>
                    <p className="text-[#333]/40 text-sm">
                      {checkIn.time}
                    </p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-[#ffc421] animate-pulse" />
                </motion.div>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[#333]/30 text-center">
                  Be the first to check in today!
                </p>
              </div>
            )}
          </div>

          {recentCheckIns.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-4 text-center"
            >
              <p className="text-[#333]/30 text-sm">
                {recentCheckIns.length} check-in{recentCheckIns.length !== 1 ? "s" : ""} today
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="py-4 text-center relative z-10"
      >
        <p className="text-[#333]/30 text-sm">
          NFC checkpoints are located throughout the building
        </p>
      </motion.footer>
    </div>
  );
}
