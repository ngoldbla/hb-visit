"use client";

import { useState, useEffect, useCallback } from "react";

interface WakeLockState {
  isSupported: boolean;
  isActive: boolean;
  error: string | null;
}

/**
 * Hook to keep the screen awake using the Screen Wake Lock API.
 * Prevents the device from dimming or locking the screen.
 *
 * Supported in Safari 16.4+ (iOS 16.4, March 2023)
 */
export function useWakeLock() {
  const [state, setState] = useState<WakeLockState>({
    isSupported: false,
    isActive: false,
    error: null,
  });
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);

  // Check if Wake Lock API is supported
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      isSupported: "wakeLock" in navigator,
    }));
  }, []);

  // Request wake lock
  const requestWakeLock = useCallback(async () => {
    if (!("wakeLock" in navigator)) {
      setState((prev) => ({
        ...prev,
        error: "Wake Lock API not supported",
      }));
      return;
    }

    try {
      const lock = await navigator.wakeLock.request("screen");
      setWakeLock(lock);
      setState((prev) => ({
        ...prev,
        isActive: true,
        error: null,
      }));

      // Handle lock release (e.g., when tab becomes hidden)
      lock.addEventListener("release", () => {
        setState((prev) => ({
          ...prev,
          isActive: false,
        }));
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isActive: false,
        error: err instanceof Error ? err.message : "Failed to acquire wake lock",
      }));
    }
  }, []);

  // Release wake lock
  const releaseWakeLock = useCallback(async () => {
    if (wakeLock) {
      await wakeLock.release();
      setWakeLock(null);
      setState((prev) => ({
        ...prev,
        isActive: false,
      }));
    }
  }, [wakeLock]);

  // Auto-request wake lock on mount and re-acquire on visibility change
  useEffect(() => {
    if (!state.isSupported) return;

    // Request wake lock immediately
    requestWakeLock();

    // Re-acquire wake lock when page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      releaseWakeLock();
    };
  }, [state.isSupported, requestWakeLock, releaseWakeLock]);

  return {
    ...state,
    requestWakeLock,
    releaseWakeLock,
  };
}
