"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useHoliday, type HolidayState, type HolidaySettings } from "@/hooks/use-holiday";

interface HolidayContextValue extends HolidayState {
  settings: HolidaySettings | null;
  refreshSettings: () => Promise<void>;
}

const HolidayContext = createContext<HolidayContextValue | undefined>(undefined);

interface HolidayProviderProps {
  children: ReactNode;
}

/**
 * HolidayProvider
 *
 * Provides holiday theming context to the entire application.
 * Automatically fetches settings from the API and updates in real-time.
 */
export function HolidayProvider({ children }: HolidayProviderProps) {
  const [settings, setSettings] = useState<HolidaySettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Fetch holiday settings from the API
  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      const data = await response.json();

      if (data.success && data.settings?.holiday_config) {
        const config = data.settings.holiday_config;
        setSettings({
          timezone: config.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          disabledHolidays: config.disabledHolidays || [],
          previewHoliday: config.previewHoliday || null,
          previewDay: config.previewDay || 1,
        });
      } else {
        // Use defaults if no settings saved
        setSettings({
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          disabledHolidays: [],
          previewHoliday: null,
          previewDay: 1,
        });
      }
    } catch (error) {
      console.error("Failed to fetch holiday settings:", error);
      // Use defaults on error
      setSettings({
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        disabledHolidays: [],
        previewHoliday: null,
        previewDay: 1,
      });
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSettings();
  }, []);

  // Use the holiday hook with the fetched settings
  const holidayState = useHoliday(settings || undefined);

  // Combine loading states
  const combinedState: HolidayContextValue = {
    ...holidayState,
    isLoading: isLoadingSettings || holidayState.isLoading,
    settings,
    refreshSettings: fetchSettings,
  };

  return (
    <HolidayContext.Provider value={combinedState}>
      {children}
    </HolidayContext.Provider>
  );
}

/**
 * useHolidayContext
 *
 * Hook to access the holiday context.
 * Must be used within a HolidayProvider.
 */
export function useHolidayContext(): HolidayContextValue {
  const context = useContext(HolidayContext);
  if (context === undefined) {
    throw new Error("useHolidayContext must be used within a HolidayProvider");
  }
  return context;
}

/**
 * useIsHoliday
 *
 * Simple hook to check if today is a holiday.
 */
export function useIsHoliday(): boolean {
  const context = useContext(HolidayContext);
  return context?.isHoliday || false;
}

/**
 * useHolidayTheme
 *
 * Hook to get just the current holiday theme.
 */
export function useHolidayTheme() {
  const context = useContext(HolidayContext);
  return context?.theme;
}
