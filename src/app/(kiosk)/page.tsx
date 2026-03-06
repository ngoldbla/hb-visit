"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AttractCycleManager } from "@/components/kiosk/attract-cycle-manager";
import { SuccessScreen } from "@/components/kiosk/success-screen";
import { MemberDirectory } from "@/components/kiosk/member-directory";
import { MobileExplainer } from "@/components/kiosk/mobile-explainer";
import { PhoneEntry } from "@/components/kiosk/phone-entry";
import { PinEntry } from "@/components/kiosk/pin-entry";
import { KioskRegister } from "@/components/kiosk/kiosk-register";
import { useIsMobile } from "@/hooks/use-mobile";
import { createClient } from "@/lib/supabase/client";

type KioskState = "attract" | "celebrating" | "directory" | "phone_entry" | "pin_entry" | "kiosk_register";

interface CelebrationStats {
  monthlyCount: number;
  monthlyGoal: number;
}

interface CheckInResult {
  visitorName: string;
  checkInTime: Date;
  location?: string;
  streak: number;
  monthlyCount: number;
  monthlyGoal: number;
}

interface PhoneLookupData {
  name: string;
  avatar_emoji: string | null;
  member_id: string;
  phone: string;
}

export default function KioskPage() {
  const isMobile = useIsMobile();
  const [state, setState] = useState<KioskState>("attract");
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null);
  const [celebrationStats, setCelebrationStats] = useState<CelebrationStats>({
    monthlyCount: 0,
    monthlyGoal: 1000,
  });
  const [phoneLookupData, setPhoneLookupData] = useState<PhoneLookupData | null>(null);
  const [registerPhone, setRegisterPhone] = useState<string | undefined>();
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch celebration stats (for success screen)
  const fetchCelebrationStats = useCallback(async () => {
    const supabase = createClient();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [goalResult, countResult] = await Promise.all([
      supabase
        .from("community_goals")
        .select("target_count, current_count")
        .eq("is_active", true)
        .eq("goal_type", "monthly_checkins")
        .single(),
      supabase
        .from("check_ins")
        .select("id", { count: "exact" })
        .gte("check_in_time", startOfMonth.toISOString())
        .eq("is_overtap", false),
    ]);

    setCelebrationStats({
      monthlyCount: countResult.count || goalResult.data?.current_count || 0,
      monthlyGoal: goalResult.data?.target_count || 1000,
    });
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCelebrationStats();
  }, [fetchCelebrationStats]);

  // Show celebration and auto-return to attract
  const showCelebration = useCallback((result: CheckInResult) => {
    // Clear any existing timer
    if (celebrationTimerRef.current) {
      clearTimeout(celebrationTimerRef.current);
    }

    setCheckInResult(result);
    setState("celebrating");

    celebrationTimerRef.current = setTimeout(() => {
      setState("attract");
      setCheckInResult(null);
      setPhoneLookupData(null);
      setRegisterPhone(undefined);
    }, 6000);
  }, []);

  // Subscribe to real-time check-ins from NFC taps, kiosk directory, and kiosk_pin
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("kiosk-checkins")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "check_ins",
        },
        async (payload) => {
          // Show celebration for NFC token check-ins (directory and pin check-ins handled by callbacks)
          if (payload.new && payload.new.check_in_method === "nfc_token") {
            // Guard: if already celebrating, ignore incoming events
            if (state === "celebrating") return;

            let streak = 1;
            if (payload.new.member_id) {
              const { data: member } = await supabase
                .from("members")
                .select("current_streak")
                .eq("id", payload.new.member_id)
                .single();
              streak = member?.current_streak || 1;
            }

            await fetchCelebrationStats();

            showCelebration({
              visitorName: payload.new.visitor_name || "Visitor",
              checkInTime: new Date(payload.new.check_in_time),
              location: payload.new.location,
              streak,
              monthlyCount: celebrationStats.monthlyCount + 1,
              monthlyGoal: celebrationStats.monthlyGoal,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCelebrationStats, celebrationStats.monthlyCount, celebrationStats.monthlyGoal, showCelebration, state]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current);
      }
    };
  }, []);

  // Directory handlers
  const handleScreenTap = useCallback(() => {
    if (state === "attract") {
      setState("directory");
    }
  }, [state]);

  const handleDirectoryClose = useCallback(() => {
    setState("attract");
  }, []);

  const handleDirectoryCheckIn = useCallback(async (memberId: string, memberName: string) => {
    await fetchCelebrationStats();

    const supabase = createClient();
    let streak = 1;
    const { data: member } = await supabase
      .from("members")
      .select("current_streak")
      .eq("id", memberId)
      .single();
    streak = member?.current_streak || 1;

    showCelebration({
      visitorName: memberName,
      checkInTime: new Date(),
      location: "kiosk",
      streak,
      monthlyCount: celebrationStats.monthlyCount + 1,
      monthlyGoal: celebrationStats.monthlyGoal,
    });
  }, [fetchCelebrationStats, celebrationStats.monthlyCount, celebrationStats.monthlyGoal, showCelebration]);

  // Phone check-in handlers
  const handlePhoneCheckIn = useCallback(() => {
    setState("phone_entry");
  }, []);

  const handlePhoneFound = useCallback((data: { name: string; avatar_emoji: string | null; member_id: string; phone: string }) => {
    setPhoneLookupData(data);
    setState("pin_entry");
  }, []);

  const handlePhoneNotFound = useCallback((phone: string) => {
    setRegisterPhone(phone);
    setState("kiosk_register");
  }, []);

  const handlePinSuccess = useCallback(async (result: { visitorName: string; streak: number; monthlyCount: number; monthlyGoal: number }) => {
    await fetchCelebrationStats();
    showCelebration({
      visitorName: result.visitorName,
      checkInTime: new Date(),
      location: "kiosk",
      streak: result.streak,
      monthlyCount: result.monthlyCount || celebrationStats.monthlyCount + 1,
      monthlyGoal: result.monthlyGoal || celebrationStats.monthlyGoal,
    });
  }, [fetchCelebrationStats, celebrationStats.monthlyCount, celebrationStats.monthlyGoal, showCelebration]);

  const handleRegisterSuccess = useCallback(async (result: { visitorName: string; streak: number; monthlyCount: number; monthlyGoal: number }) => {
    await fetchCelebrationStats();
    showCelebration({
      visitorName: result.visitorName,
      checkInTime: new Date(),
      location: "kiosk",
      streak: result.streak,
      monthlyCount: result.monthlyCount || celebrationStats.monthlyCount + 1,
      monthlyGoal: result.monthlyGoal || celebrationStats.monthlyGoal,
    });
  }, [fetchCelebrationStats, celebrationStats.monthlyCount, celebrationStats.monthlyGoal, showCelebration]);

  const handleBackToAttract = useCallback(() => {
    setState("attract");
    setPhoneLookupData(null);
    setRegisterPhone(undefined);
  }, []);

  const handleBackToPhoneEntry = useCallback(() => {
    setState("phone_entry");
    setPhoneLookupData(null);
  }, []);

  // Show mobile explainer on small screens
  if (isMobile) {
    return <MobileExplainer />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      <AnimatePresence mode="wait">
        {state === "attract" && (
          <motion.div
            key="attract"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full"
          >
            <AttractCycleManager
              onScreenTap={handleScreenTap}
              onPhoneCheckIn={handlePhoneCheckIn}
            />
          </motion.div>
        )}

        {state === "directory" && (
          <motion.div
            key="directory"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <MemberDirectory
              onCheckIn={handleDirectoryCheckIn}
              onClose={handleDirectoryClose}
            />
          </motion.div>
        )}

        {state === "phone_entry" && (
          <motion.div
            key="phone_entry"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <PhoneEntry
              onFound={handlePhoneFound}
              onNotFound={handlePhoneNotFound}
              onBack={handleBackToAttract}
            />
          </motion.div>
        )}

        {state === "pin_entry" && phoneLookupData && (
          <motion.div
            key="pin_entry"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <PinEntry
              memberName={phoneLookupData.name}
              memberEmoji={phoneLookupData.avatar_emoji}
              memberId={phoneLookupData.member_id}
              phone={phoneLookupData.phone}
              onSuccess={handlePinSuccess}
              onBack={handleBackToPhoneEntry}
            />
          </motion.div>
        )}

        {state === "kiosk_register" && (
          <motion.div
            key="kiosk_register"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <KioskRegister
              initialPhone={registerPhone}
              onSuccess={handleRegisterSuccess}
              onBack={handleBackToAttract}
            />
          </motion.div>
        )}

        {state === "celebrating" && checkInResult && (
          <motion.div
            key="celebrating"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full h-full"
          >
            <SuccessScreen
              visitorName={checkInResult.visitorName}
              streak={checkInResult.streak}
              monthlyCount={checkInResult.monthlyCount}
              monthlyGoal={checkInResult.monthlyGoal}
              location={checkInResult.location}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
