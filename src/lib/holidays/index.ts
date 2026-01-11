/**
 * Holiday System Exports
 *
 * Central export point for all holiday-related functionality.
 */

// Date calculation utilities
export {
  getFixedDate,
  getNthWeekday,
  getEaster,
  getGoodFriday,
  getHanukkah,
  getPassover,
  getRoshHashanah,
  getYomKippur,
  getPurim,
  getLunarNewYear,
  getChineseZodiac,
  getDiwali,
  getHoli,
  getEidAlFitr,
  getEidAlAdha,
  getSuperBowl,
  isDateInHoliday,
  getDayOfHoliday,
  getDateInTimezone,
  getYearInTimezone,
  type HolidayDate,
} from './calculator';

// Holiday registry
export {
  HOLIDAYS,
  getHolidayById,
  getEnabledHolidays,
  getHolidaysByPriority,
  getActiveHolidaysOnDate,
  getActiveHoliday,
  getHolidaysInYear,
  getAllHolidayIds,
  getHolidaysByCategory,
  type Holiday,
} from './registry';

// Themes
export {
  HOLIDAY_THEMES,
  getHolidayTheme,
  getDefaultTheme,
  applyQuoteTransform,
  getWelcomeMessage,
  getProgressionEmoji,
  type HolidayTheme,
  type ParticleShape,
  type SoundMode,
  type SoundTheme,
} from './themes';

// Context (client-side only)
export {
  HolidayProvider,
  useHolidayContext,
  useIsHoliday,
  useHolidayTheme,
} from './context';
