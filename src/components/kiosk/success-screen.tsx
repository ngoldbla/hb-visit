"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Flame, Users, Sparkles, Trophy } from "lucide-react";

interface SuccessScreenProps {
  visitorName: string;
  streak?: number;
  monthlyCount?: number;
  monthlyGoal?: number;
  location?: string;
}

// Enhanced confetti with more variety
function Confetti() {
  const colors = ["#2153ff", "#10b981", "#ffc421", "#ff6b6b", "#4ecdc4", "#a855f7"];
  const pieces = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.3,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 12 + 6,
    rotation: Math.random() * 360,
    type: Math.random() > 0.7 ? "star" : Math.random() > 0.5 ? "circle" : "square",
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{
            y: -50,
            x: `${piece.x}vw`,
            opacity: 1,
            rotate: 0,
            scale: 0
          }}
          animate={{
            y: "110vh",
            opacity: [1, 1, 0],
            rotate: piece.rotation + 720,
            scale: [0, 1, 1, 0.5]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: piece.delay,
            ease: [0.23, 1, 0.32, 1],
          }}
          className="absolute"
          style={{
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: piece.type === "circle" ? "50%" : piece.type === "star" ? "2px" : "0",
            boxShadow: `0 0 ${piece.size}px ${piece.color}40`,
          }}
        />
      ))}
    </div>
  );
}

// Radial burst effect
function BurstEffect() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0.8 }}
      animate={{ scale: 4, opacity: 0 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-[#2153ff] to-[#10b981]"
    />
  );
}

// Floating particles background
function CelebrationParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 6 + 3,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[#ffc421]"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -50, 0],
            opacity: [0, 0.6, 0],
            scale: [0.5, 1.2, 0.5],
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

// Streak flame animation
function StreakBadge({ streak }: { streak: number }) {
  const isOnFire = streak >= 3;
  const isBlazing = streak >= 7;

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
      className={`
        relative px-8 py-4 rounded-2xl border-2
        ${isBlazing
          ? "bg-gradient-to-r from-orange-500/30 to-red-500/30 border-orange-400"
          : isOnFire
            ? "bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border-orange-400/50"
            : "bg-white/10 border-white/20"
        }
      `}
    >
      <div className="flex items-center gap-3">
        <motion.div
          animate={isOnFire ? {
            scale: [1, 1.2, 1],
            rotate: [-5, 5, -5],
          } : {}}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <Flame className={`w-10 h-10 ${isBlazing ? "text-orange-400" : isOnFire ? "text-orange-400" : "text-white/60"}`} />
        </motion.div>
        <div className="text-center">
          <motion.span
            className={`text-4xl font-bold ${isBlazing ? "text-orange-400" : isOnFire ? "text-orange-300" : "text-white"}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Day {streak}
          </motion.span>
          <p className="text-white/50 text-sm">
            {isBlazing ? "You're on fire!" : isOnFire ? "Keep it going!" : "streak"}
          </p>
        </div>
      </div>

      {/* Flame particles for blazing streaks */}
      {isBlazing && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-orange-400"
              animate={{
                y: [-10, -30],
                opacity: [1, 0],
                scale: [1, 0.5],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              style={{ left: `${(i - 1) * 10}px` }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// Community milestone badge
function MilestoneBadge({ count, goal }: { count: number; goal: number }) {
  const progress = Math.min((count / goal) * 100, 100);
  const isMilestone = count % 100 === 0 || count === goal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="bg-white/5 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10"
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <Users className="w-8 h-8 text-[#2153ff]" />
          {isMilestone && (
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute -top-1 -right-1"
            >
              <Sparkles className="w-4 h-4 text-[#ffc421]" />
            </motion.div>
          )}
        </div>
        <div>
          <p className="text-white/70 text-sm">You're check-in</p>
          <p className="text-white text-2xl font-bold">
            #{count.toLocaleString()}
            <span className="text-white/40 text-lg font-normal"> this month</span>
          </p>
        </div>
      </div>

      {/* Mini progress bar */}
      <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ delay: 1, duration: 1, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-[#2153ff] to-[#10b981] rounded-full"
        />
      </div>
      <p className="text-white/40 text-xs mt-1">
        {Math.round(progress)}% to {goal.toLocaleString()} goal
      </p>
    </motion.div>
  );
}

export function SuccessScreen({
  visitorName,
  streak = 1,
  monthlyCount = 0,
  monthlyGoal = 1000,
  location,
}: SuccessScreenProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [showBurst, setShowBurst] = useState(true);

  useEffect(() => {
    const confettiTimer = setTimeout(() => setShowConfetti(false), 4000);
    const burstTimer = setTimeout(() => setShowBurst(false), 1000);
    return () => {
      clearTimeout(confettiTimer);
      clearTimeout(burstTimer);
    };
  }, []);

  const now = new Date();
  const timeString = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const firstName = visitorName.split(" ")[0];
  const isNewStreak = streak === 1;
  const isMilestoneCheckIn = monthlyCount % 50 === 0;

  return (
    <div className="h-full bg-gradient-to-br from-[#0a0a12] via-[#0f0f1a] to-[#0a0a12] flex flex-col items-center justify-center gap-6 px-8 relative overflow-hidden">
      <CelebrationParticles />
      {showConfetti && <Confetti />}

      {/* Success icon with burst */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative"
      >
        {showBurst && <BurstEffect />}
        <motion.div
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(16, 185, 129, 0.4)",
              "0 0 60px 20px rgba(16, 185, 129, 0.2)",
              "0 0 0 0 rgba(16, 185, 129, 0.4)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-36 h-36 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center shadow-2xl"
        >
          <CheckCircle2 className="w-20 h-20 text-white" />
        </motion.div>
      </motion.div>

      {/* Welcome message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <h1 className="text-6xl font-bold text-white tracking-tight">
          Welcome, {firstName}!
        </h1>
        {isMilestoneCheckIn && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-2 mt-3"
          >
            <Trophy className="w-5 h-5 text-[#ffc421]" />
            <span className="text-[#ffc421] font-semibold">Milestone check-in!</span>
            <Trophy className="w-5 h-5 text-[#ffc421]" />
          </motion.div>
        )}
      </motion.div>

      {/* Check-in time */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-3 text-white/60"
      >
        <Clock className="w-5 h-5" />
        <span className="text-lg">Checked in at {timeString}</span>
        {location && location !== "unknown" && (
          <>
            <span className="text-white/30">•</span>
            <span className="text-lg capitalize">{location}</span>
          </>
        )}
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row items-center gap-6 mt-4"
      >
        {/* Streak badge */}
        <StreakBadge streak={streak} />

        {/* Community milestone */}
        <MilestoneBadge count={monthlyCount} goal={monthlyGoal} />
      </motion.div>

      {/* Encouraging message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-xl text-white/50 mt-4"
      >
        {isNewStreak
          ? "Great start! Come back tomorrow to build your streak."
          : streak >= 7
            ? "Incredible dedication! You're a HatchBridge regular."
            : streak >= 3
              ? "You're building momentum! Keep it up."
              : "Nice to see you again!"}
      </motion.p>

      {/* Auto-reset indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8"
      >
        <p className="text-sm text-white/20">
          This screen will reset automatically
        </p>
      </motion.div>
    </div>
  );
}
