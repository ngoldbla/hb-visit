/**
 * Holiday Registry
 *
 * Defines all holidays with their date calculations and metadata.
 * Each holiday references the calculator module for accurate date computation.
 */

import {
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
  getDiwali,
  getHoli,
  getEidAlFitr,
  getEidAlAdha,
  getSuperBowl,
  type HolidayDate,
} from './calculator';

export interface Holiday {
  id: string;
  name: string;
  shortName?: string; // For tight spaces
  type: 'fixed' | 'variable';
  category: 'federal' | 'religious' | 'cultural' | 'observance' | 'fun';
  dateCalculator: (year: number) => HolidayDate;
  enabled: boolean;
  priority: number; // Higher = takes precedence when overlapping (1-10)
  description?: string;
}

// ============================================================================
// HOLIDAY DEFINITIONS
// ============================================================================

export const HOLIDAYS: Holiday[] = [
  // ==========================================================================
  // JANUARY
  // ==========================================================================
  {
    id: 'new-years-day',
    name: "New Year's Day",
    shortName: 'New Year',
    type: 'fixed',
    category: 'federal',
    dateCalculator: (year) => getFixedDate(year, 1, 1),
    enabled: true,
    priority: 10,
    description: 'Celebrate the start of a new year!',
  },
  {
    id: 'mlk-day',
    name: 'Martin Luther King Jr. Day',
    shortName: 'MLK Day',
    type: 'variable',
    category: 'federal',
    dateCalculator: (year) => getNthWeekday(year, 1, 1, 3), // 3rd Monday of January
    enabled: true,
    priority: 8,
    description: 'Honoring the legacy of Dr. Martin Luther King Jr.',
  },
  {
    id: 'lunar-new-year',
    name: 'Lunar New Year',
    shortName: 'Lunar New Year',
    type: 'variable',
    category: 'cultural',
    dateCalculator: getLunarNewYear,
    enabled: true,
    priority: 7,
    description: 'Celebrating the start of the lunar calendar year',
  },

  // ==========================================================================
  // FEBRUARY
  // ==========================================================================
  {
    id: 'groundhog-day',
    name: 'Groundhog Day',
    type: 'fixed',
    category: 'fun',
    dateCalculator: (year) => getFixedDate(year, 2, 2),
    enabled: true,
    priority: 3,
    description: 'Will the groundhog see its shadow?',
  },
  {
    id: 'super-bowl',
    name: 'Super Bowl Sunday',
    shortName: 'Super Bowl',
    type: 'variable',
    category: 'fun',
    dateCalculator: getSuperBowl,
    enabled: true,
    priority: 4,
    description: 'The big game!',
  },
  {
    id: 'valentines-day',
    name: "Valentine's Day",
    shortName: 'Valentine',
    type: 'fixed',
    category: 'observance',
    dateCalculator: (year) => getFixedDate(year, 2, 14),
    enabled: true,
    priority: 6,
    description: 'A day to celebrate love and friendship',
  },
  {
    id: 'presidents-day',
    name: "Presidents' Day",
    type: 'variable',
    category: 'federal',
    dateCalculator: (year) => getNthWeekday(year, 2, 1, 3), // 3rd Monday of February
    enabled: true,
    priority: 7,
    description: 'Honoring the presidents of the United States',
  },

  // ==========================================================================
  // MARCH
  // ==========================================================================
  {
    id: 'purim',
    name: 'Purim',
    type: 'variable',
    category: 'religious',
    dateCalculator: getPurim,
    enabled: true,
    priority: 5,
    description: 'Festival of lots',
  },
  {
    id: 'holi',
    name: 'Holi',
    shortName: 'Holi',
    type: 'variable',
    category: 'cultural',
    dateCalculator: getHoli,
    enabled: true,
    priority: 6,
    description: 'Festival of colors',
  },
  {
    id: 'st-patricks-day',
    name: "St. Patrick's Day",
    shortName: "St. Pat's",
    type: 'fixed',
    category: 'cultural',
    dateCalculator: (year) => getFixedDate(year, 3, 17),
    enabled: true,
    priority: 6,
    description: 'Celebrating Irish culture and heritage',
  },

  // ==========================================================================
  // MARCH/APRIL (Variable)
  // ==========================================================================
  {
    id: 'passover',
    name: 'Passover',
    shortName: 'Passover',
    type: 'variable',
    category: 'religious',
    dateCalculator: getPassover,
    enabled: true,
    priority: 7,
    description: 'Festival of freedom',
  },
  {
    id: 'good-friday',
    name: 'Good Friday',
    type: 'variable',
    category: 'religious',
    dateCalculator: getGoodFriday,
    enabled: true,
    priority: 6,
    description: 'Commemorating the crucifixion of Jesus',
  },
  {
    id: 'easter',
    name: 'Easter',
    type: 'variable',
    category: 'religious',
    dateCalculator: getEaster,
    enabled: true,
    priority: 8,
    description: 'Celebrating resurrection and renewal',
  },
  {
    id: 'eid-al-fitr',
    name: 'Eid al-Fitr',
    shortName: 'Eid',
    type: 'variable',
    category: 'religious',
    dateCalculator: getEidAlFitr,
    enabled: true,
    priority: 7,
    description: 'Festival of breaking the fast',
  },

  // ==========================================================================
  // APRIL
  // ==========================================================================
  {
    id: 'earth-day',
    name: 'Earth Day',
    type: 'fixed',
    category: 'observance',
    dateCalculator: (year) => getFixedDate(year, 4, 22),
    enabled: true,
    priority: 5,
    description: 'Celebrating our planet',
  },

  // ==========================================================================
  // MAY
  // ==========================================================================
  {
    id: 'cinco-de-mayo',
    name: 'Cinco de Mayo',
    type: 'fixed',
    category: 'cultural',
    dateCalculator: (year) => getFixedDate(year, 5, 5),
    enabled: true,
    priority: 5,
    description: 'Celebrating Mexican heritage and pride',
  },
  {
    id: 'mothers-day',
    name: "Mother's Day",
    shortName: "Mom's Day",
    type: 'variable',
    category: 'observance',
    dateCalculator: (year) => getNthWeekday(year, 5, 0, 2), // 2nd Sunday of May
    enabled: true,
    priority: 7,
    description: 'Honoring mothers everywhere',
  },
  {
    id: 'memorial-day',
    name: 'Memorial Day',
    type: 'variable',
    category: 'federal',
    dateCalculator: (year) => getNthWeekday(year, 5, 1, -1), // Last Monday of May
    enabled: true,
    priority: 8,
    description: 'Honoring those who gave their lives in service',
  },

  // ==========================================================================
  // JUNE
  // ==========================================================================
  {
    id: 'eid-al-adha',
    name: 'Eid al-Adha',
    shortName: 'Eid',
    type: 'variable',
    category: 'religious',
    dateCalculator: getEidAlAdha,
    enabled: true,
    priority: 7,
    description: 'Festival of sacrifice',
  },
  {
    id: 'fathers-day',
    name: "Father's Day",
    shortName: "Dad's Day",
    type: 'variable',
    category: 'observance',
    dateCalculator: (year) => getNthWeekday(year, 6, 0, 3), // 3rd Sunday of June
    enabled: true,
    priority: 7,
    description: 'Honoring fathers everywhere',
  },
  {
    id: 'juneteenth',
    name: 'Juneteenth',
    type: 'fixed',
    category: 'federal',
    dateCalculator: (year) => getFixedDate(year, 6, 19),
    enabled: true,
    priority: 8,
    description: 'Celebrating freedom and emancipation',
  },

  // ==========================================================================
  // JULY
  // ==========================================================================
  {
    id: 'independence-day',
    name: 'Independence Day',
    shortName: 'July 4th',
    type: 'fixed',
    category: 'federal',
    dateCalculator: (year) => getFixedDate(year, 7, 4),
    enabled: true,
    priority: 10,
    description: 'Celebrating American independence',
  },
  {
    id: 'bastille-day',
    name: 'Bastille Day',
    type: 'fixed',
    category: 'cultural',
    dateCalculator: (year) => getFixedDate(year, 7, 14),
    enabled: false, // Disabled by default - enable for French communities
    priority: 4,
    description: 'French National Day',
  },

  // ==========================================================================
  // SEPTEMBER
  // ==========================================================================
  {
    id: 'labor-day',
    name: 'Labor Day',
    type: 'variable',
    category: 'federal',
    dateCalculator: (year) => getNthWeekday(year, 9, 1, 1), // 1st Monday of September
    enabled: true,
    priority: 8,
    description: 'Celebrating workers and their achievements',
  },
  {
    id: 'rosh-hashanah',
    name: 'Rosh Hashanah',
    type: 'variable',
    category: 'religious',
    dateCalculator: getRoshHashanah,
    enabled: true,
    priority: 7,
    description: 'Jewish New Year',
  },
  {
    id: 'yom-kippur',
    name: 'Yom Kippur',
    type: 'variable',
    category: 'religious',
    dateCalculator: getYomKippur,
    enabled: true,
    priority: 7,
    description: 'Day of Atonement',
  },

  // ==========================================================================
  // OCTOBER
  // ==========================================================================
  {
    id: 'indigenous-peoples-day',
    name: "Indigenous Peoples' Day",
    shortName: 'Indigenous Day',
    type: 'variable',
    category: 'federal',
    dateCalculator: (year) => getNthWeekday(year, 10, 1, 2), // 2nd Monday of October
    enabled: true,
    priority: 7,
    description: 'Honoring Indigenous peoples and cultures',
  },
  {
    id: 'diwali',
    name: 'Diwali',
    type: 'variable',
    category: 'cultural',
    dateCalculator: getDiwali,
    enabled: true,
    priority: 7,
    description: 'Festival of lights',
  },
  {
    id: 'halloween',
    name: 'Halloween',
    type: 'fixed',
    category: 'fun',
    dateCalculator: (year) => getFixedDate(year, 10, 31),
    enabled: true,
    priority: 8,
    description: 'Spooky season is here!',
  },

  // ==========================================================================
  // NOVEMBER
  // ==========================================================================
  {
    id: 'day-of-the-dead',
    name: 'Day of the Dead',
    shortName: 'Día de Muertos',
    type: 'fixed',
    category: 'cultural',
    dateCalculator: (year) => {
      // November 1-2
      const start = new Date(year, 10, 1, 0, 0, 0, 0);
      const end = new Date(year, 10, 2, 23, 59, 59, 999);
      return { start, end, totalDays: 2 };
    },
    enabled: true,
    priority: 6,
    description: 'Celebrating and remembering loved ones',
  },
  {
    id: 'veterans-day',
    name: 'Veterans Day',
    type: 'fixed',
    category: 'federal',
    dateCalculator: (year) => getFixedDate(year, 11, 11),
    enabled: true,
    priority: 8,
    description: 'Honoring all who have served',
  },
  {
    id: 'thanksgiving',
    name: 'Thanksgiving',
    type: 'variable',
    category: 'federal',
    dateCalculator: (year) => getNthWeekday(year, 11, 4, 4), // 4th Thursday of November
    enabled: true,
    priority: 9,
    description: 'A day of gratitude and togetherness',
  },

  // ==========================================================================
  // DECEMBER
  // ==========================================================================
  {
    id: 'hanukkah',
    name: 'Hanukkah',
    shortName: 'Hanukkah',
    type: 'variable',
    category: 'religious',
    dateCalculator: getHanukkah,
    enabled: true,
    priority: 8,
    description: 'Festival of lights',
  },
  {
    id: 'christmas-eve',
    name: 'Christmas Eve',
    type: 'fixed',
    category: 'observance',
    dateCalculator: (year) => getFixedDate(year, 12, 24),
    enabled: true,
    priority: 7,
    description: 'The night before Christmas',
  },
  {
    id: 'christmas',
    name: 'Christmas',
    type: 'fixed',
    category: 'federal',
    dateCalculator: (year) => getFixedDate(year, 12, 25),
    enabled: true,
    priority: 10,
    description: 'Celebrating the holiday season',
  },
  {
    id: 'kwanzaa',
    name: 'Kwanzaa',
    type: 'fixed',
    category: 'cultural',
    dateCalculator: (year) => {
      // December 26 - January 1
      const start = new Date(year, 11, 26, 0, 0, 0, 0);
      const end = new Date(year + 1, 0, 1, 23, 59, 59, 999);
      return { start, end, totalDays: 7 };
    },
    enabled: true,
    priority: 7,
    description: 'Celebrating African heritage and culture',
  },
  {
    id: 'new-years-eve',
    name: "New Year's Eve",
    shortName: 'NYE',
    type: 'fixed',
    category: 'observance',
    dateCalculator: (year) => getFixedDate(year, 12, 31),
    enabled: true,
    priority: 9,
    description: 'Ring in the new year!',
  },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get a holiday by its ID
 */
export function getHolidayById(id: string): Holiday | undefined {
  return HOLIDAYS.find((h) => h.id === id);
}

/**
 * Get all enabled holidays
 */
export function getEnabledHolidays(disabledIds: string[] = []): Holiday[] {
  return HOLIDAYS.filter(
    (h) => h.enabled && !disabledIds.includes(h.id)
  );
}

/**
 * Get all holidays sorted by priority (highest first)
 */
export function getHolidaysByPriority(holidays: Holiday[] = HOLIDAYS): Holiday[] {
  return [...holidays].sort((a, b) => b.priority - a.priority);
}

/**
 * Get all holidays that are active on a given date
 */
export function getActiveHolidaysOnDate(
  date: Date,
  disabledIds: string[] = []
): { holiday: Holiday; dayOfHoliday: number; totalDays: number }[] {
  const year = date.getFullYear();
  const enabledHolidays = getEnabledHolidays(disabledIds);
  const activeHolidays: { holiday: Holiday; dayOfHoliday: number; totalDays: number }[] = [];

  for (const holiday of enabledHolidays) {
    // Check current year
    const dates = holiday.dateCalculator(year);
    if (date >= dates.start && date <= dates.end) {
      const dayOfHoliday = getDayOfHoliday(date, dates);
      activeHolidays.push({
        holiday,
        dayOfHoliday,
        totalDays: dates.totalDays || 1,
      });
      continue;
    }

    // For holidays that span year boundaries (like Kwanzaa), check previous year
    if (holiday.id === 'kwanzaa') {
      const prevDates = holiday.dateCalculator(year - 1);
      if (date >= prevDates.start && date <= prevDates.end) {
        const dayOfHoliday = getDayOfHoliday(date, prevDates);
        activeHolidays.push({
          holiday,
          dayOfHoliday,
          totalDays: prevDates.totalDays || 1,
        });
      }
    }
  }

  // Sort by priority (highest first)
  return activeHolidays.sort((a, b) => b.holiday.priority - a.holiday.priority);
}

/**
 * Get the highest priority active holiday on a given date
 */
export function getActiveHoliday(
  date: Date,
  disabledIds: string[] = []
): { holiday: Holiday; dayOfHoliday: number; totalDays: number } | null {
  const active = getActiveHolidaysOnDate(date, disabledIds);
  return active.length > 0 ? active[0] : null;
}

/**
 * Get which day of a multi-day holiday the date falls on
 */
function getDayOfHoliday(date: Date, holidayDates: { start: Date; end: Date; totalDays?: number }): number {
  const startDay = new Date(holidayDates.start);
  startDay.setHours(0, 0, 0, 0);

  const checkDay = new Date(date);
  checkDay.setHours(0, 0, 0, 0);

  const diffTime = checkDay.getTime() - startDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays + 1; // 1-indexed
}

/**
 * Get all holidays in a given year (for calendar display)
 */
export function getHolidaysInYear(
  year: number,
  disabledIds: string[] = []
): { holiday: Holiday; dates: { start: Date; end: Date; totalDays?: number } }[] {
  const enabledHolidays = getEnabledHolidays(disabledIds);

  return enabledHolidays.map((holiday) => ({
    holiday,
    dates: holiday.dateCalculator(year),
  }));
}

/**
 * Get all holiday IDs for admin configuration
 */
export function getAllHolidayIds(): string[] {
  return HOLIDAYS.map((h) => h.id);
}

/**
 * Get holidays by category
 */
export function getHolidaysByCategory(category: Holiday['category']): Holiday[] {
  return HOLIDAYS.filter((h) => h.category === category);
}
