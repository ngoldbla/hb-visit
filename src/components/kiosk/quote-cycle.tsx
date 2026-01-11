"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export interface Quote {
  id: string;
  text: string;
  author: string | null;
  category: string | null;
  source: string | null;
}

interface QuoteCycleProps {
  quotes: Quote[];
  displayDuration?: number; // milliseconds, default 8000
  onSkip?: () => void; // callback to skip to stats screen
}

// Floating particles background
function ParticleBackground() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
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
          className="absolute rounded-full bg-[#ffc421]/20"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.4, 0.2],
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

export function QuoteCycle({ quotes, displayDuration = 8000, onSkip }: QuoteCycleProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (quotes.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % quotes.length);
    }, displayDuration);

    return () => clearInterval(interval);
  }, [quotes.length, displayDuration]);

  if (quotes.length === 0) {
    return null;
  }

  const currentQuote = quotes[currentIndex];

  return (
    <div
      className="h-full bg-[#fff9e9] flex flex-col relative overflow-hidden cursor-pointer touch-auto"
      onClick={onSkip}
    >
      <ParticleBackground />

      {/* Header with logo */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-8 pb-4 flex flex-col items-center relative z-10"
      >
        <Image
          src="/hatchbridge-logo.svg"
          alt="HatchBridge"
          width={160}
          height={40}
          priority
        />
      </motion.header>

      {/* Quote content */}
      <div className="flex-1 flex items-center justify-center px-12 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuote.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl"
          >
            {/* Quote mark */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[#ffc421]/30 text-8xl font-serif mb-4"
            >
              &ldquo;
            </motion.div>

            {/* Quote text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl md:text-4xl lg:text-5xl font-medium text-[#000824] leading-relaxed tracking-tight"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {currentQuote.text}
            </motion.p>

            {/* Author */}
            {currentQuote.author && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xl text-[#333]/60 mt-8 font-medium"
              >
                &mdash; {currentQuote.author}
                {currentQuote.source && (
                  <span className="text-[#333]/40 font-normal">
                    , {currentQuote.source}
                  </span>
                )}
              </motion.p>
            )}

            {/* Category badge */}
            {currentQuote.category && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6"
              >
                <span className="inline-block bg-[#ffc421]/20 text-[#000824]/60 px-4 py-1.5 rounded-full text-sm font-medium">
                  {currentQuote.category}
                </span>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      {quotes.length > 1 && (
        <div className="pb-8 flex items-center justify-center gap-2 relative z-10">
          {quotes.map((_, i) => (
            <motion.div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                i === currentIndex ? "bg-[#ffc421]" : "bg-[#333]/10"
              }`}
              animate={i === currentIndex ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      )}

      {/* Tap to continue instruction */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-6 left-0 right-0 text-center"
      >
        <motion.div
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center justify-center gap-2"
        >
          <span className="text-[#333]/40 text-sm">Tap anywhere to continue</span>
          <svg
            className="w-4 h-4 text-[#333]/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}
