"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHolidayTheme, applyQuoteTransform, getDefaultTheme } from "@/lib/holidays";
import type { Quote } from "./quote-cycle";

interface EmbeddedQuoteRotatorProps {
  quotes: Quote[];
  rotateInterval?: number; // milliseconds, default 10000
}

export function EmbeddedQuoteRotator({ quotes, rotateInterval = 10000 }: EmbeddedQuoteRotatorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const theme = useHolidayTheme() || getDefaultTheme();
  const colors = theme.colors;

  useEffect(() => {
    if (quotes.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % quotes.length);
    }, rotateInterval);

    return () => clearInterval(interval);
  }, [quotes.length, rotateInterval]);

  if (quotes.length === 0) return null;

  const currentQuote = quotes[currentIndex];
  const displayText = applyQuoteTransform(currentQuote.text, theme);

  return (
    <div
      className="rounded-2xl p-5 min-h-[120px] flex items-center justify-center"
      style={{ backgroundColor: `${colors.primary}10` }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuote.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p
            className="text-lg leading-relaxed font-medium"
            style={{ fontFamily: "Georgia, serif", color: colors.text }}
          >
            &ldquo;{displayText}&rdquo;
          </p>
          {currentQuote.author && (
            <p className="text-sm text-[#333]/50 mt-2">
              &mdash; {currentQuote.author}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
