"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface ThemeOverlayProps {
  overlay: string;
  respectful?: boolean;
}

// Snow overlay for winter holidays
function SnowOverlay({ count }: { count: number }) {
  const flakes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: Math.random() * 8 + 6,
        duration: Math.random() * 10 + 10,
        delay: Math.random() * 5,
        drift: Math.random() * 30 - 15,
      })),
    [count]
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {flakes.map((flake) => (
        <motion.div
          key={flake.id}
          className="absolute"
          style={{
            left: `${flake.x}%`,
            fontSize: flake.size,
          }}
          initial={{ y: -20, opacity: 0.9 }}
          animate={{
            y: "110vh",
            x: [0, flake.drift, -flake.drift, 0],
          }}
          transition={{
            duration: flake.duration,
            repeat: Infinity,
            delay: flake.delay,
            ease: "linear",
            x: {
              duration: flake.duration / 2,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        >
          ❄️
        </motion.div>
      ))}
    </div>
  );
}

// Hearts overlay for Valentine's Day
function HeartsOverlay({ count }: { count: number }) {
  const hearts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: Math.random() * 10 + 8,
        duration: Math.random() * 8 + 6,
        delay: Math.random() * 4,
        rotate: Math.random() * 30 - 15,
      })),
    [count]
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {hearts.map((heart) => (
        <motion.div
          key={heart.id}
          className="absolute"
          style={{
            left: `${heart.x}%`,
            fontSize: heart.size,
          }}
          initial={{ y: "110vh", opacity: 0.8, rotate: 0 }}
          animate={{
            y: -50,
            rotate: [heart.rotate, -heart.rotate, heart.rotate],
          }}
          transition={{
            duration: heart.duration,
            repeat: Infinity,
            delay: heart.delay,
            ease: "easeOut",
            rotate: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        >
          ❤️
        </motion.div>
      ))}
    </div>
  );
}

// Fireworks overlay for New Year's, July 4th
function FireworksOverlay({ respectful }: { respectful?: boolean }) {
  const bursts = useMemo(
    () =>
      Array.from({ length: respectful ? 3 : 6 }, (_, i) => ({
        id: i,
        x: 20 + Math.random() * 60,
        y: 20 + Math.random() * 40,
        delay: i * 1.5 + Math.random(),
        scale: Math.random() * 0.5 + 0.8,
      })),
    [respectful]
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {bursts.map((burst) => (
        <motion.div
          key={burst.id}
          className="absolute"
          style={{
            left: `${burst.x}%`,
            top: `${burst.y}%`,
            fontSize: 40 * burst.scale,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1.5, 1.2, 0],
            opacity: [0, 1, 0.8, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: burst.delay,
            repeatDelay: 3,
          }}
        >
          ✨
        </motion.div>
      ))}
    </div>
  );
}

// Leaves overlay for fall holidays
function LeavesOverlay({ count }: { count: number }) {
  const leaves = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        emoji: ["🍂", "🍁", "🍃"][Math.floor(Math.random() * 3)],
        size: Math.random() * 8 + 8,
        duration: Math.random() * 12 + 8,
        delay: Math.random() * 6,
        sway: Math.random() * 40 - 20,
        rotate: Math.random() * 360,
      })),
    [count]
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {leaves.map((leaf) => (
        <motion.div
          key={leaf.id}
          className="absolute"
          style={{
            left: `${leaf.x}%`,
            fontSize: leaf.size,
          }}
          initial={{ y: -30, opacity: 0.8, rotate: 0 }}
          animate={{
            y: "110vh",
            x: [0, leaf.sway, -leaf.sway, 0],
            rotate: [0, leaf.rotate, leaf.rotate * 2],
          }}
          transition={{
            duration: leaf.duration,
            repeat: Infinity,
            delay: leaf.delay,
            ease: "linear",
          }}
        >
          {leaf.emoji}
        </motion.div>
      ))}
    </div>
  );
}

// Shamrocks overlay for St. Patrick's Day
function ShamrocksOverlay({ count }: { count: number }) {
  const shamrocks = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: Math.random() * 8 + 6,
        duration: Math.random() * 15 + 10,
        delay: Math.random() * 5,
        rotate: Math.random() * 360,
      })),
    [count]
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {shamrocks.map((shamrock) => (
        <motion.div
          key={shamrock.id}
          className="absolute"
          style={{
            left: `${shamrock.x}%`,
            fontSize: shamrock.size,
          }}
          initial={{ y: -30, opacity: 0.7 }}
          animate={{
            y: "110vh",
            rotate: [0, shamrock.rotate],
          }}
          transition={{
            duration: shamrock.duration,
            repeat: Infinity,
            delay: shamrock.delay,
            ease: "linear",
          }}
        >
          ☘️
        </motion.div>
      ))}
    </div>
  );
}

// Eggs overlay for Easter
function EggsOverlay({ count }: { count: number }) {
  const eggs = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        emoji: ["🥚", "🐣", "🐰", "🌷"][Math.floor(Math.random() * 4)],
        size: Math.random() * 10 + 8,
        duration: Math.random() * 10 + 8,
        delay: Math.random() * 5,
      })),
    [count]
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {eggs.map((egg) => (
        <motion.div
          key={egg.id}
          className="absolute"
          style={{
            left: `${egg.x}%`,
            fontSize: egg.size,
          }}
          initial={{ y: -30, opacity: 0.8 }}
          animate={{
            y: "110vh",
            rotate: [-10, 10, -10],
          }}
          transition={{
            duration: egg.duration,
            repeat: Infinity,
            delay: egg.delay,
            ease: "linear",
            rotate: {
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        >
          {egg.emoji}
        </motion.div>
      ))}
    </div>
  );
}

// Lanterns overlay for Lunar New Year
function LanternsOverlay({ count }: { count: number }) {
  const lanterns = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: Math.random() * 10 + 10,
        duration: Math.random() * 20 + 15,
        delay: Math.random() * 8,
        sway: Math.random() * 20 - 10,
      })),
    [count]
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {lanterns.map((lantern) => (
        <motion.div
          key={lantern.id}
          className="absolute"
          style={{
            left: `${lantern.x}%`,
            fontSize: lantern.size,
          }}
          initial={{ y: "110vh", opacity: 0.9 }}
          animate={{
            y: -50,
            x: [0, lantern.sway, -lantern.sway, 0],
          }}
          transition={{
            duration: lantern.duration,
            repeat: Infinity,
            delay: lantern.delay,
            ease: "linear",
            x: {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        >
          🏮
        </motion.div>
      ))}
    </div>
  );
}

// Colors overlay for Holi
function ColorsOverlay({ count }: { count: number }) {
  const colors = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: ["#FF1493", "#00FF00", "#FFD700", "#FF4500", "#9400D3", "#00CED1"][
          Math.floor(Math.random() * 6)
        ],
        size: Math.random() * 30 + 20,
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 5,
      })),
    [count]
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {colors.map((splash) => (
        <motion.div
          key={splash.id}
          className="absolute rounded-full"
          style={{
            left: `${splash.x}%`,
            top: `${splash.y}%`,
            width: splash.size,
            height: splash.size,
            backgroundColor: splash.color,
            filter: "blur(8px)",
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0, 0.4, 0],
          }}
          transition={{
            duration: splash.duration,
            repeat: Infinity,
            delay: splash.delay,
            repeatDelay: 2,
          }}
        />
      ))}
    </div>
  );
}

// Diyas overlay for Diwali
function DiyasOverlay({ count }: { count: number }) {
  const diyas = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: Math.random() * 8 + 8,
        duration: Math.random() * 15 + 12,
        delay: Math.random() * 6,
        flicker: Math.random() * 0.3 + 0.7,
      })),
    [count]
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {diyas.map((diya) => (
        <motion.div
          key={diya.id}
          className="absolute"
          style={{
            left: `${diya.x}%`,
            fontSize: diya.size,
          }}
          initial={{ y: "110vh" }}
          animate={{
            y: -50,
            opacity: [diya.flicker, 1, diya.flicker],
          }}
          transition={{
            duration: diya.duration,
            repeat: Infinity,
            delay: diya.delay,
            ease: "linear",
            opacity: {
              duration: 0.5,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        >
          🪔
        </motion.div>
      ))}
    </div>
  );
}

// Marigolds overlay for Day of the Dead
function MarigoldsOverlay({ count }: { count: number }) {
  const flowers = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        emoji: ["🌼", "💀", "🌺"][Math.floor(Math.random() * 3)],
        size: Math.random() * 8 + 8,
        duration: Math.random() * 12 + 8,
        delay: Math.random() * 6,
        rotate: Math.random() * 360,
      })),
    [count]
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {flowers.map((flower) => (
        <motion.div
          key={flower.id}
          className="absolute"
          style={{
            left: `${flower.x}%`,
            fontSize: flower.size,
          }}
          initial={{ y: -30, opacity: 0.8 }}
          animate={{
            y: "110vh",
            rotate: [0, flower.rotate],
          }}
          transition={{
            duration: flower.duration,
            repeat: Infinity,
            delay: flower.delay,
            ease: "linear",
          }}
        >
          {flower.emoji}
        </motion.div>
      ))}
    </div>
  );
}

// Flowers overlay for Mother's Day
function FlowersOverlay({ count }: { count: number }) {
  const flowers = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        emoji: ["🌸", "🌷", "🌺", "🌹", "💐"][Math.floor(Math.random() * 5)],
        size: Math.random() * 10 + 8,
        duration: Math.random() * 12 + 8,
        delay: Math.random() * 5,
        sway: Math.random() * 20 - 10,
      })),
    [count]
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {flowers.map((flower) => (
        <motion.div
          key={flower.id}
          className="absolute"
          style={{
            left: `${flower.x}%`,
            fontSize: flower.size,
          }}
          initial={{ y: -30, opacity: 0.8 }}
          animate={{
            y: "110vh",
            x: [0, flower.sway, -flower.sway, 0],
          }}
          transition={{
            duration: flower.duration,
            repeat: Infinity,
            delay: flower.delay,
            ease: "linear",
          }}
        >
          {flower.emoji}
        </motion.div>
      ))}
    </div>
  );
}

// Spiderwebs overlay for Halloween (subtle)
function SpiderwebsOverlay({ respectful }: { respectful?: boolean }) {
  const webs = useMemo(
    () =>
      Array.from({ length: respectful ? 2 : 4 }, (_, i) => ({
        id: i,
        x: i % 2 === 0 ? -5 : 85,
        y: Math.floor(i / 2) * 50,
        size: 80 + Math.random() * 40,
        opacity: 0.15 + Math.random() * 0.1,
      })),
    [respectful]
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-30">
      {webs.map((web) => (
        <motion.div
          key={web.id}
          className="absolute"
          style={{
            left: `${web.x}%`,
            top: `${web.y}%`,
            fontSize: web.size,
            opacity: web.opacity,
          }}
          animate={{
            opacity: [web.opacity, web.opacity * 1.5, web.opacity],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          🕸️
        </motion.div>
      ))}
    </div>
  );
}

export function ThemeOverlay({ overlay, respectful }: ThemeOverlayProps) {
  const count = respectful ? 15 : 30;

  switch (overlay) {
    case "snow":
      return <SnowOverlay count={count} />;
    case "hearts":
      return <HeartsOverlay count={count} />;
    case "fireworks":
      return <FireworksOverlay respectful={respectful} />;
    case "leaves":
      return <LeavesOverlay count={count} />;
    case "shamrocks":
      return <ShamrocksOverlay count={count} />;
    case "eggs":
      return <EggsOverlay count={count} />;
    case "lanterns":
      return <LanternsOverlay count={Math.floor(count / 2)} />;
    case "colors":
      return <ColorsOverlay count={count} />;
    case "diyas":
      return <DiyasOverlay count={count} />;
    case "marigolds":
      return <MarigoldsOverlay count={count} />;
    case "flowers":
      return <FlowersOverlay count={count} />;
    case "spiderwebs":
      return <SpiderwebsOverlay respectful={respectful} />;
    default:
      return null;
  }
}
