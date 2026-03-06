"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Flame, HandMetal, Phone, QrCode, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Image from "next/image";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { useHolidayTheme, getDefaultTheme } from "@/lib/holidays";
import { ThemedParticles } from "./themed-particles";
import { ThemeOverlay } from "./theme-overlay";
import type { Quote } from "./quote-cycle";

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
  quotes?: Quote[];
  onScreenTap?: () => void;
  onPhoneCheckIn?: () => void;
}

// Compact progress ring for the header
function ProgressRing({
  progress,
  size = 40,
  primaryColor = "#ffc421",
  secondaryColor = "#ff9d00",
}: {
  progress: number;
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
}) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const gradientId = `progressGradient-${primaryColor.replace("#", "")}-${secondaryColor.replace("#", "")}`;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(0,0,0,0.08)"
        strokeWidth={strokeWidth}
      />
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
        style={{ strokeDasharray: circumference }}
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

// Auto-scrolling hook for the activity feed
function useAutoScroll(ref: React.RefObject<HTMLDivElement | null>, itemCount: number) {
  const animFrameRef = useRef<number>(0);
  const pauseUntilRef = useRef<number>(0);
  const directionRef = useRef<"down" | "up">("down");

  const animate = useCallback(() => {
    const el = ref.current;
    if (!el || itemCount <= 0) {
      animFrameRef.current = requestAnimationFrame(animate);
      return;
    }

    const now = Date.now();
    if (now < pauseUntilRef.current) {
      animFrameRef.current = requestAnimationFrame(animate);
      return;
    }

    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) {
      animFrameRef.current = requestAnimationFrame(animate);
      return;
    }

    const speed = 0.5; // px per frame (~30px/sec at 60fps)

    if (directionRef.current === "down") {
      el.scrollTop += speed;
      if (el.scrollTop >= maxScroll) {
        directionRef.current = "up";
        pauseUntilRef.current = now + 2000;
      }
    } else {
      el.scrollTop -= speed * 3; // scroll back faster
      if (el.scrollTop <= 0) {
        directionRef.current = "down";
        pauseUntilRef.current = now + 1000;
      }
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, [ref, itemCount]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [animate]);
}

export function AttractMode({ stats, quotes, onScreenTap, onPhoneCheckIn }: AttractModeProps) {
  useWakeLock();

  const theme = useHolidayTheme() || getDefaultTheme();
  const colors = theme.colors;

  const bgStyle = colors.background.startsWith("linear-gradient")
    ? { background: colors.background }
    : { backgroundColor: colors.background };

  const monthlyCount = stats?.monthlyCount ?? 0;
  const monthlyGoal = stats?.monthlyGoal ?? 1000;
  const progress = Math.min((monthlyCount / monthlyGoal) * 100, 100);
  const recentCheckIns = stats?.recentCheckIns ?? [];
  const topStreak = stats?.topStreak ?? 0;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useAutoScroll(scrollContainerRef, recentCheckIns.length);

  const [showQrModal, setShowQrModal] = useState(false);

  return (
    <div className="h-full flex flex-col relative overflow-hidden" style={bgStyle}>
      <ThemedParticles theme={theme} />
      {theme.decorations.overlay && (
        <ThemeOverlay overlay={theme.decorations.overlay} respectful={theme.respectful} />
      )}

      {/* Compact Header: Logo + Goal + Streak */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-8 py-4 flex items-center justify-between relative z-10"
      >
        <div className="flex items-center gap-4">
          <Image
            src="/hatchbridge-logo.svg"
            alt="HatchBridge"
            width={160}
            height={40}
            priority
          />
          <span className="text-[#333]/50 text-base font-medium">Incubator Check-In</span>
        </div>

        <div className="flex items-center gap-6">
          {/* Compact goal */}
          <div className="flex items-center gap-2">
            <ProgressRing
              progress={progress}
              size={40}
              primaryColor={colors.primary}
              secondaryColor={colors.secondary}
            />
            <div className="text-sm">
              <span className="font-bold" style={{ color: colors.text }}>
                {monthlyCount}
              </span>
              <span className="text-[#333]/50">/{monthlyGoal}</span>
              <span className="text-[#333]/40 ml-1">({Math.round(progress)}%)</span>
            </div>
          </div>

          {/* Streak */}
          {topStreak > 0 && (
            <div className="flex items-center gap-1.5">
              <Flame className="w-5 h-5" style={{ color: colors.secondary }} />
              <span className="text-sm font-bold" style={{ color: colors.secondary }}>
                {topStreak}-day
              </span>
              <span className="text-[#333]/50 text-sm">streak</span>
            </div>
          )}
        </div>
      </motion.header>

      {/* Main 2-column layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 px-8 pb-4 relative z-10 min-h-0">
        {/* Left column (~40%) - Welcome hero + check-in CTAs */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 flex flex-col items-center justify-center gap-8"
        >
          {/* Welcome text */}
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-3" style={{ color: colors.text }}>
              Welcome!
            </h1>
            <p className="text-[#333]/50 text-lg">
              Tap your phone or check in below
            </p>
          </div>

          {/* Primary CTA: Check In With Phone */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onPhoneCheckIn}
            className="w-full max-w-xs flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-bold text-xl shadow-lg transition-colors"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              color: colors.text,
            }}
          >
            <Phone className="w-6 h-6" />
            Check In With Phone
          </motion.button>

          {/* Secondary CTA: Find Your Name */}
          <button
            onClick={onScreenTap}
            className="flex items-center gap-3 px-6 py-3 rounded-2xl font-semibold text-base transition-colors"
            style={{
              backgroundColor: `${colors.primary}20`,
              color: colors.text,
            }}
          >
            <HandMetal className="w-5 h-5" style={{ color: colors.primary }} />
            Find Your Name
          </button>

          {/* Tertiary: QR code icon */}
          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-2 text-[#333]/40 hover:text-[#333]/60 transition-colors text-sm"
          >
            <QrCode className="w-4 h-4" />
            Scan QR Code
          </button>
        </motion.div>

        {/* Right column (~60%) - Activity Feed */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-3 bg-white rounded-3xl p-6 shadow-lg shadow-black/5 border border-black/5 flex flex-col min-h-0"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#333]/70 font-semibold text-lg">Today&apos;s Members</h3>
            {recentCheckIns.length > 0 && (
              <span className="text-[#333]/40 text-sm">
                {recentCheckIns.length} check-in{recentCheckIns.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Scrollable activity list with gradient fade */}
          <div className="flex-1 relative min-h-0">
            {recentCheckIns.length > 0 ? (
              <>
                {/* Top gradient fade */}
                <div
                  className="absolute top-0 left-0 right-0 h-8 z-10 pointer-events-none"
                  style={{
                    background: "linear-gradient(to bottom, white, transparent)",
                  }}
                />

                <div
                  ref={scrollContainerRef}
                  className="h-full overflow-hidden space-y-2 py-2"
                >
                  {recentCheckIns.map((checkIn, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl px-4 py-3"
                      style={{ backgroundColor: `${colors.primary}10` }}
                    >
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
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
                        className="w-2 h-2 rounded-full animate-pulse shrink-0"
                        style={{ backgroundColor: colors.primary }}
                      />
                    </div>
                  ))}
                </div>

                {/* Bottom gradient fade */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-8 z-10 pointer-events-none"
                  style={{
                    background: "linear-gradient(to top, white, transparent)",
                  }}
                />
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-[#333]/30 text-center text-lg">
                  Be the first to check in today!
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Footer hint */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="px-8 py-3 flex items-center justify-center relative z-10"
      >
        <p className="text-[#333]/30 text-sm">
          Tap NFC checkpoint with your phone for instant check-in
        </p>
      </motion.footer>

      {/* QR Code Modal */}
      {showQrModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowQrModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm mx-4 text-center"
          >
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setShowQrModal(false)}
                className="text-[#333]/40 hover:text-[#333] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="w-56 h-56 mx-auto mb-4">
              <QRCodeSVG
                value={REGISTRATION_URL}
                size={224}
                level="M"
                bgColor="transparent"
                fgColor={colors.text}
              />
            </div>
            <h3 className="text-xl font-bold text-[#000824] mb-1">
              Scan to Register
            </h3>
            <p className="text-[#333]/50 text-sm">
              Use your phone&apos;s camera to scan this QR code
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
