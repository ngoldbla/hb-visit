"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, MapPin, Clock, User } from "lucide-react";

interface SuccessScreenProps {
  visitorName: string;
  hostName?: string;
  meetingRoom?: string;
}

// Simple confetti component
function Confetti() {
  const colors = ["#2153ff", "#ff6b6b", "#4ecdc4", "#ffe66d", "#95e1d3"];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 10 + 5,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{ y: -20, x: `${piece.x}vw`, opacity: 1 }}
          animate={{ y: "100vh", opacity: 0 }}
          transition={{
            duration: 2 + Math.random(),
            delay: piece.delay,
            ease: "easeIn",
          }}
          className="absolute"
          style={{
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "0",
          }}
        />
      ))}
    </div>
  );
}

export function SuccessScreen({
  visitorName,
  hostName,
  meetingRoom,
}: SuccessScreenProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const now = new Date();
  const timeString = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="h-full flex flex-col items-center justify-center gap-8 px-8">
      {showConfetti && <Confetti />}

      {/* Success icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <div className="w-32 h-32 rounded-full bg-emerald-500 flex items-center justify-center shadow-xl">
          <CheckCircle2 className="w-20 h-20 text-white" />
        </div>
      </motion.div>

      {/* Welcome message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <h1 className="text-5xl font-bold text-[#000824]">
          Welcome, {visitorName.split(" ")[0]}!
        </h1>
      </motion.div>

      {/* Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/60 backdrop-blur rounded-3xl p-8 shadow-lg max-w-md w-full space-y-4"
      >
        <div className="flex items-center gap-4 text-[#000824]">
          <Clock className="w-6 h-6 text-[#2153ff]" />
          <span className="text-xl">Checked in at {timeString}</span>
        </div>

        {hostName && (
          <div className="flex items-center gap-4 text-[#000824]">
            <User className="w-6 h-6 text-[#2153ff]" />
            <span className="text-xl">Meeting with {hostName}</span>
          </div>
        )}

        {meetingRoom && (
          <div className="flex items-center gap-4 text-[#000824]">
            <MapPin className="w-6 h-6 text-[#2153ff]" />
            <span className="text-xl">{meetingRoom}</span>
          </div>
        )}
      </motion.div>

      {/* Host notification */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-xl text-[#000824]/60"
      >
        {hostName ? `${hostName} has been notified.` : "Enjoy your visit!"}
      </motion.p>

      {/* Auto-reset indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8"
      >
        <p className="text-lg text-[#000824]/40">
          This screen will reset automatically
        </p>
      </motion.div>
    </div>
  );
}
