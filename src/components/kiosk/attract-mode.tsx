"use client";

import { motion } from "framer-motion";
import { Smartphone, Flame, Users, TrendingUp } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

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

// Floating particles background
function ParticleBackground() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[#2153ff]/20"
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

// Progress ring component
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
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#progressGradient)"
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
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2153ff" />
          <stop offset="100%" stopColor="#10b981" />
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
    <div className="h-full bg-gradient-to-br from-[#0a0a12] via-[#0f0f1a] to-[#0a0a12] flex flex-col relative overflow-hidden">
      <ParticleBackground />

      {/* Header with logo */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-8 pb-4 text-center relative z-10"
      >
        <h1 className="text-4xl font-bold text-white tracking-tight">
          <span className="text-[#2153ff]">Hatch</span>Bridge
        </h1>
        <p className="text-white/40 text-lg mt-1">Incubator Check-In</p>
      </motion.header>

      {/* Main content grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 px-8 pb-8 relative z-10">

        {/* Left column - Community Goal */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 flex flex-col items-center justify-center border border-white/10"
        >
          <div className="relative">
            <ProgressRing progress={progress} size={180} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-white">
                <AnimatedCounter value={monthlyCount} />
              </span>
              <span className="text-white/50 text-sm">check-ins</span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-white/70 text-lg">
              Help us reach <span className="text-[#ffc421] font-bold">{monthlyGoal.toLocaleString()}</span> this month!
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Users className="w-5 h-5 text-[#2153ff]" />
              <span className="text-white/50">
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
              className="mt-6 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl px-5 py-3 border border-orange-500/30"
            >
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <span className="text-white/80 text-sm">
                  Someone is on a <span className="text-orange-400 font-bold">{topStreak}-day</span> streak!
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
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 0 0 0 rgba(33, 83, 255, 0.4)",
                  "0 0 60px 20px rgba(33, 83, 255, 0.15)",
                  "0 0 0 0 rgba(33, 83, 255, 0.4)",
                ],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-44 h-44 rounded-[2rem] bg-gradient-to-br from-[#2153ff] to-[#1a42cc] flex items-center justify-center mx-auto shadow-2xl shadow-[#2153ff]/30 border border-white/20"
            >
              <Smartphone className="w-24 h-24 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mt-6">
              Tap to Check In
            </h2>
            <p className="text-white/50 text-lg mt-2">
              Hold your phone to any NFC point
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 w-full max-w-xs">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="text-white/30 font-medium text-sm uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          {/* Registration QR Code */}
          <div className="text-center">
            <motion.div
              animate={{
                borderColor: ["rgba(255,255,255,0.1)", "rgba(33,83,255,0.5)", "rgba(255,255,255,0.1)"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-36 h-36 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-xl p-3 border-2"
            >
              <QRCodeSVG
                value={REGISTRATION_URL}
                size={120}
                level="M"
                bgColor="transparent"
                fgColor="#000824"
              />
            </motion.div>
            <h3 className="text-xl font-semibold text-white/80 mt-4">
              First Time?
            </h3>
            <p className="text-white/40 mt-1">
              Scan to register
            </p>
          </div>
        </motion.div>

        {/* Right column - Activity Feed */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10 flex flex-col"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#10b981]" />
            <h3 className="text-white/70 font-semibold">Recent Activity</h3>
          </div>

          <div className="flex-1 space-y-3 overflow-hidden">
            {recentCheckIns.length > 0 ? (
              recentCheckIns.slice(0, 8).map((checkIn, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2153ff] to-[#10b981] flex items-center justify-center text-white font-bold text-sm">
                    {checkIn.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {checkIn.name}
                    </p>
                    <p className="text-white/40 text-sm">
                      {checkIn.time}
                    </p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                </motion.div>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-white/30 text-center">
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
              <p className="text-white/30 text-sm">
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
        <p className="text-white/20 text-sm">
          NFC check-in points are located throughout the building
        </p>
      </motion.footer>
    </div>
  );
}
