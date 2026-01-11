"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { type ParticleShape, type HolidayTheme, getDefaultTheme } from "@/lib/holidays";

interface ThemedParticlesProps {
  theme?: HolidayTheme | null;
  count?: number;
  respectful?: boolean;
}

// Map particle shapes to emoji representations
const SHAPE_EMOJI: Partial<Record<ParticleShape, string>> = {
  snowflake: "❄️",
  heart: "❤️",
  star: "⭐",
  shamrock: "☘️",
  pumpkin: "🎃",
  ghost: "👻",
  bat: "🦇",
  turkey: "🦃",
  gift: "🎁",
  ornament: "🎄",
  "candy-cane": "🍬",
  flower: "🌸",
  butterfly: "🦋",
  leaf: "🍂",
  skull: "💀",
  dove: "🕊️",
  flag: "🇺🇸",
  lantern: "🏮",
  dragon: "🐉",
  egg: "🥚",
  firework: "✨",
  dreidel: "🪆",
  menorah: "🕎",
  marigold: "🌼",
  diya: "🪔",
  coin: "🪙",
  rainbow: "🌈",
  football: "🏈",
};

function renderParticle(
  shape: ParticleShape,
  color: string,
  size: number
): React.ReactNode {
  const emoji = SHAPE_EMOJI[shape];

  // Use emoji if available
  if (emoji) {
    return (
      <span
        style={{
          fontSize: size * 2,
          lineHeight: 1,
          filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))",
        }}
      >
        {emoji}
      </span>
    );
  }

  // Fallback to colored shapes for circle, square
  if (shape === "circle") {
    return (
      <div
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: "50%",
          opacity: 0.6,
        }}
      />
    );
  }

  if (shape === "square") {
    return (
      <div
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          opacity: 0.6,
        }}
      />
    );
  }

  // Default fallback to circle
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: "50%",
        opacity: 0.6,
      }}
    />
  );
}

export function ThemedParticles({
  theme,
  count: countOverride,
  respectful: respectfulOverride,
}: ThemedParticlesProps) {
  const activeTheme = theme || getDefaultTheme();
  const isRespectful = respectfulOverride ?? activeTheme.respectful ?? false;

  // Calculate particle count based on theme and respectful mode
  const baseCount = countOverride ?? activeTheme.particles.count ?? 80;
  const particleCount = isRespectful ? Math.floor(baseCount * 0.5) : baseCount;

  // Cap at 30 particles for performance
  const effectiveCount = Math.min(particleCount, 30);

  // Calculate speed multiplier
  const speed = isRespectful ? "slow" : (activeTheme.particles.speed || "normal");
  const speedMultiplier = {
    slow: 1.8,
    normal: 1,
    fast: 0.6,
  }[speed];

  // Generate particles with memoization
  const particles = useMemo(() => {
    const shapes = activeTheme.particles.shapes;
    const colors = activeTheme.particles.colors;

    return Array.from({ length: effectiveCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 4,
      duration: (Math.random() * 20 + 15) * speedMultiplier,
      delay: Math.random() * 5,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  }, [activeTheme.particles.shapes, activeTheme.particles.colors, effectiveCount, speedMultiplier]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: isRespectful ? [0.15, 0.35, 0.15] : [0.25, 0.55, 0.25],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        >
          {renderParticle(p.shape, p.color, p.size)}
        </motion.div>
      ))}
    </div>
  );
}
