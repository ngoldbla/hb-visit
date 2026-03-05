"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useHolidayTheme, getDefaultTheme } from "@/lib/holidays";

interface Member {
  id: string;
  name: string;
  avatar_emoji: string | null;
}

interface MemberDirectoryProps {
  onCheckIn: (memberId: string, memberName: string) => void;
  onClose: () => void;
}

const IDLE_TIMEOUT = 30000; // 30 seconds

export function MemberDirectory({ onCheckIn, onClose }: MemberDirectoryProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [activeLetterIndex, setActiveLetterIndex] = useState<number | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const theme = useHolidayTheme() || getDefaultTheme();
  const colors = theme.colors;

  // Reset idle timer on any interaction
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(onClose, IDLE_TIMEOUT);
  }, [onClose]);

  // Fetch members
  useEffect(() => {
    async function fetchMembers() {
      const supabase = createClient();
      const { data } = await supabase
        .from("members")
        .select("id, name, avatar_emoji")
        .neq("is_active", false)
        .order("name", { ascending: true });

      setMembers(data || []);
      setLoading(false);
    }

    fetchMembers();
    resetIdleTimer();

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [resetIdleTimer]);

  // Group members by first letter
  const grouped = new Map<string, Member[]>();
  for (const member of members) {
    const letter = member.name.charAt(0).toUpperCase();
    if (!grouped.has(letter)) {
      grouped.set(letter, []);
    }
    grouped.get(letter)!.push(member);
  }

  const availableLetters = Array.from(grouped.keys()).sort();
  const allLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const handleLetterTap = (letter: string) => {
    resetIdleTimer();
    const el = sectionRefs.current.get(letter);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleMemberTap = async (member: Member) => {
    resetIdleTimer();
    if (checkingInId) return; // Prevent double-tap

    setCheckingInId(member.id);
    try {
      const response = await fetch("/api/kiosk/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: member.id }),
      });
      const data = await response.json();

      if (data.success) {
        onCheckIn(member.id, member.name);
      } else {
        // Reset on failure
        setCheckingInId(null);
      }
    } catch {
      setCheckingInId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col relative touch-auto"
      style={{ backgroundColor: colors.background.startsWith("linear-gradient") ? "#fff9e9" : colors.background }}
      onTouchStart={resetIdleTimer}
      onClick={resetIdleTimer}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
        <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
          Find Your Name
        </h1>
        <button
          onClick={onClose}
          className="p-3 rounded-full hover:bg-black/5 transition-colors touch-auto"
        >
          <X className="w-6 h-6 text-[#333]/60" />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#333]/40" />
        </div>
      ) : (
        <div className="flex-1 flex min-h-0">
          {/* A-Z sidebar */}
          <div className="w-12 flex flex-col items-center justify-center py-2 gap-0.5 shrink-0">
            {allLetters.map((letter, i) => {
              const isActive = availableLetters.includes(letter);
              return (
                <button
                  key={letter}
                  onClick={() => isActive && handleLetterTap(letter)}
                  onTouchStart={() => {
                    if (isActive) {
                      setActiveLetterIndex(i);
                      handleLetterTap(letter);
                    }
                  }}
                  onTouchEnd={() => setActiveLetterIndex(null)}
                  className={`w-8 h-[calc((100%-2rem)/26)] min-h-[20px] flex items-center justify-center text-xs font-bold rounded touch-auto transition-colors ${
                    activeLetterIndex === i
                      ? "scale-125"
                      : ""
                  }`}
                  style={{
                    color: isActive ? colors.primary : "#33333330",
                  }}
                  disabled={!isActive}
                >
                  {letter}
                </button>
              );
            })}
          </div>

          {/* Member grid */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <AnimatePresence>
              {availableLetters.map((letter) => (
                <div
                  key={letter}
                  ref={(el) => {
                    if (el) sectionRefs.current.set(letter, el);
                  }}
                >
                  {/* Letter header */}
                  <div
                    className="sticky top-0 z-10 px-2 py-2 text-sm font-bold"
                    style={{
                      color: colors.primary,
                      backgroundColor: colors.background.startsWith("linear-gradient")
                        ? "#fff9e9"
                        : colors.background,
                    }}
                  >
                    {letter}
                  </div>

                  {/* Members grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {grouped.get(letter)!.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => handleMemberTap(member)}
                        disabled={checkingInId !== null}
                        className="flex items-center gap-3 px-4 py-4 rounded-xl text-left transition-all touch-auto active:scale-[0.97]"
                        style={{
                          backgroundColor: checkingInId === member.id
                            ? `${colors.primary}30`
                            : `${colors.primary}08`,
                          minHeight: 60,
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.secondary})`,
                          }}
                        >
                          <span className="text-lg">
                            {member.avatar_emoji || member.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span
                          className="font-medium truncate text-base"
                          style={{ color: colors.text }}
                        >
                          {member.name}
                        </span>
                        {checkingInId === member.id && (
                          <Loader2 className="w-4 h-4 animate-spin ml-auto shrink-0" style={{ color: colors.primary }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
}
