"use client";

import { motion } from "framer-motion";
import { Nfc, Flame, Users, TrendingUp } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Image from "next/image";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { useHolidayTheme, getDefaultTheme } from "@/lib/holidays";
import { ThemedParticles } from "./themed-particles";
import { ThemeOverlay } from "./theme-overlay";

// The URL for NFC stickers and registration QR
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
const REGISTRATION_URL = `${SITE_URL}/tap?loc=kiosk`;

interface CommunityStats {
  monthlyCount: number;
  monthlyGoal: number;
  recentCheckIns: Array<{ name: string; time: string; emoji: string | null }>;
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

// Progress ring component with dynamic colors
function ProgressRing({
  progress,
  size = 200,
  primaryColor = "#ffc421",
  secondaryColor = "#ff9d00",
}: {
  progress: number;
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
}) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  // Use unique gradient ID based on colors to avoid conflicts
  const gradientId = `progressGradient-${primaryColor.replace("#", "")}-${secondaryColor.replace("#", "")}`;

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
        stroke={`url(#${gradientId})`}
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
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function AttractMode({ stats }: AttractModeProps) {
  // Keep screen awake in kiosk mode
  useWakeLock();

  // Get holiday theme (or default)
  const theme = useHolidayTheme() || getDefaultTheme();
  const colors = theme.colors;

  // Parse background (could be gradient or solid color)
  const bgStyle = colors.background.startsWith("linear-gradient")
    ? { background: colors.background }
    : { backgroundColor: colors.background };

  const monthlyCount = stats?.monthlyCount ?? 0;
  const monthlyGoal = stats?.monthlyGoal ?? 1000;
  const progress = Math.min((monthlyCount / monthlyGoal) * 100, 100);
  const recentCheckIns = stats?.recentCheckIns ?? [];
  const topStreak = stats?.topStreak ?? 0;

  return (
    <div className="h-full flex flex-col relative overflow-hidden" style={bgStyle}>
      <ThemedParticles theme={theme} />
      {theme.decorations.overlay && (
        <ThemeOverlay overlay={theme.decorations.overlay} respectful={theme.respectful} />
      )}

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
            <ProgressRing
              progress={progress}
              size={180}
              primaryColor={colors.primary}
              secondaryColor={colors.secondary}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold" style={{ color: colors.text }}>
                <AnimatedCounter value={monthlyCount} />
              </span>
              <span className="text-[#333]/50 text-sm">check-ins</span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-[#333]/70 text-lg">
              Help us reach <span className="font-bold" style={{ color: colors.text }}>{monthlyGoal.toLocaleString()}</span> this month!
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Users className="w-5 h-5" style={{ color: colors.primary }} />
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
              className="mt-6 rounded-full px-5 py-3"
              style={{
                background: `linear-gradient(to right, ${colors.primary}33, ${colors.secondary}33)`,
                borderWidth: 1,
                borderColor: `${colors.primary}66`,
              }}
            >
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5" style={{ color: colors.secondary }} />
                <span className="text-[#333]/80 text-sm">
                  Someone is on a <span className="font-bold" style={{ color: colors.secondary }}>{topStreak}-day</span> streak!
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
                  `0 8px 32px ${colors.primary}4D`,
                  `0 12px 48px ${colors.primary}80`,
                  `0 8px 32px ${colors.primary}4D`,
                ],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-40 h-40 rounded-[2rem] flex items-center justify-center mx-auto border-4 border-white"
              style={{
                background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.secondary})`,
              }}
            >
              {theme.decorations.iconEmoji ? (
                <span className="text-6xl">{theme.decorations.iconEmoji}</span>
              ) : (
                <Nfc className="w-20 h-20" style={{ color: colors.text }} />
              )}
            </motion.div>
            <h2 className="text-3xl font-bold mt-6" style={{ color: colors.text }}>
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
                borderColor: ["rgba(0,0,0,0.1)", `${colors.primary}99`, "rgba(0,0,0,0.1)"],
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
                fgColor={colors.text}
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
            <TrendingUp className="w-5 h-5" style={{ color: colors.primary }} />
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
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ backgroundColor: `${colors.primary}15` }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{
                      background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.secondary})`,
                      color: colors.text,
                    }}
                  >
                    {checkIn.emoji ? (
                      <span className="text-xl">{checkIn.emoji}</span>
                    ) : (
                      checkIn.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: colors.text }}>
                      {checkIn.name}
                    </p>
                    <p className="text-[#333]/40 text-sm">
                      {checkIn.time}
                    </p>
                  </div>
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: colors.primary }}
                  />
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
