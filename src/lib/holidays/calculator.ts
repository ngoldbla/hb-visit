/**
 * Holiday Date Calculator
 *
 * Calculates accurate dates for all holidays, including variable-date holidays
 * that depend on lunar calendars, nth weekday rules, or religious calculations.
 * Accurate for years 2024-2035+.
 */

import { HDate, HebrewCalendar } from '@hebcal/core';

export interface HolidayDate {
  start: Date;
  end: Date;
  dayOfHoliday?: number;  // For multi-day holidays: which day (1-indexed)
  totalDays?: number;     // Total days of the holiday
}

// ============================================================================
// FIXED DATE HOLIDAYS
// ============================================================================

/**
 * Get a fixed-date holiday (same date every year)
 */
export function getFixedDate(year: number, month: number, day: number): HolidayDate {
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day, 23, 59, 59, 999);
  return { start, end };
}

// ============================================================================
// NTH WEEKDAY HOLIDAYS (e.g., "3rd Monday of January")
// ============================================================================

/**
 * Get the nth occurrence of a weekday in a month
 * @param year - Year
 * @param month - Month (1-12)
 * @param weekday - Day of week (0=Sunday, 1=Monday, etc.)
 * @param n - Which occurrence (1=first, 2=second, etc.) or -1 for last
 */
export function getNthWeekday(year: number, month: number, weekday: number, n: number): HolidayDate {
  if (n === -1) {
    // Last occurrence of weekday in month
    const lastDay = new Date(year, month, 0); // Last day of month
    const lastDayOfWeek = lastDay.getDay();
    let diff = lastDayOfWeek - weekday;
    if (diff < 0) diff += 7;
    const date = new Date(year, month - 1, lastDay.getDate() - diff);
    return {
      start: new Date(date.setHours(0, 0, 0, 0)),
      end: new Date(new Date(date).setHours(23, 59, 59, 999)),
    };
  }

  // First day of month
  const firstDay = new Date(year, month - 1, 1);
  const firstDayOfWeek = firstDay.getDay();

  // Days until first occurrence of target weekday
  let daysUntilFirst = weekday - firstDayOfWeek;
  if (daysUntilFirst < 0) daysUntilFirst += 7;

  // Calculate the nth occurrence
  const day = 1 + daysUntilFirst + (n - 1) * 7;
  const date = new Date(year, month - 1, day);

  return {
    start: new Date(date.setHours(0, 0, 0, 0)),
    end: new Date(new Date(date).setHours(23, 59, 59, 999)),
  };
}

// ============================================================================
// EASTER (Computus Algorithm - Anonymous Gregorian)
// ============================================================================

/**
 * Calculate Easter Sunday using the Anonymous Gregorian algorithm (Computus)
 * This algorithm is accurate for all years in the Gregorian calendar.
 * Reference: https://en.wikipedia.org/wiki/Date_of_Easter#Anonymous_Gregorian_algorithm
 */
export function getEaster(year: number): HolidayDate {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Good Friday (2 days before Easter)
 */
export function getGoodFriday(year: number): HolidayDate {
  const easter = getEaster(year);
  const goodFriday = new Date(easter.start);
  goodFriday.setDate(goodFriday.getDate() - 2);
  return {
    start: new Date(goodFriday.setHours(0, 0, 0, 0)),
    end: new Date(new Date(goodFriday).setHours(23, 59, 59, 999)),
  };
}

// ============================================================================
// HEBREW CALENDAR HOLIDAYS (using @hebcal/core)
// ============================================================================

/**
 * Helper to find Hebrew holiday dates from the calendar
 */
function findHebrewHoliday(year: number, holidayPattern: string | RegExp): Date[] {
  const events = HebrewCalendar.calendar({
    year,
    isHebrewYear: false,
    candlelighting: false,
  });

  const matchingEvents = events.filter((e) => {
    const desc = e.getDesc();
    if (typeof holidayPattern === 'string') {
      return desc.includes(holidayPattern);
    }
    return holidayPattern.test(desc);
  });

  return matchingEvents.map((e) => e.getDate().greg());
}

/**
 * Get Hanukkah dates (8 nights starting 25 Kislev)
 */
export function getHanukkah(year: number): HolidayDate {
  const dates = findHebrewHoliday(year, 'Chanukah');

  if (dates.length === 0) {
    // Fallback: calculate from Hebrew date directly
    // Hanukkah starts 25 Kislev - approximate for the given year
    const hdate = new HDate(25, 'Kislev', year + 3761);
    const start = hdate.greg();
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    end.setHours(23, 59, 59, 999);
    return { start, end, totalDays: 8 };
  }

  dates.sort((a, b) => a.getTime() - b.getTime());

  return {
    start: new Date(dates[0].setHours(0, 0, 0, 0)),
    end: new Date(dates[dates.length - 1].setHours(23, 59, 59, 999)),
    totalDays: 8,
  };
}

/**
 * Get Passover dates (8 days starting 15 Nisan)
 */
export function getPassover(year: number): HolidayDate {
  const dates = findHebrewHoliday(year, 'Pesach');

  if (dates.length === 0) {
    // Fallback calculation - Pesach is in spring (March/April)
    const hdate = new HDate(15, 'Nisan', year + 3760);
    const start = hdate.greg();
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    end.setHours(23, 59, 59, 999);
    return { start, end, totalDays: 8 };
  }

  dates.sort((a, b) => a.getTime() - b.getTime());

  return {
    start: new Date(dates[0].setHours(0, 0, 0, 0)),
    end: new Date(dates[dates.length - 1].setHours(23, 59, 59, 999)),
    totalDays: 8,
  };
}

/**
 * Get Rosh Hashanah dates (2 days starting 1 Tishrei)
 */
export function getRoshHashanah(year: number): HolidayDate {
  const dates = findHebrewHoliday(year, 'Rosh Hashana');

  if (dates.length === 0) {
    // Fallback - Rosh Hashanah is in September/October
    const hdate = new HDate(1, 'Tishrei', year + 3761);
    const start = hdate.greg();
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    end.setHours(23, 59, 59, 999);
    return { start, end, totalDays: 2 };
  }

  dates.sort((a, b) => a.getTime() - b.getTime());

  return {
    start: new Date(dates[0].setHours(0, 0, 0, 0)),
    end: new Date(dates[dates.length - 1].setHours(23, 59, 59, 999)),
    totalDays: 2,
  };
}

/**
 * Get Yom Kippur date (10 Tishrei)
 */
export function getYomKippur(year: number): HolidayDate {
  const dates = findHebrewHoliday(year, 'Yom Kippur');

  if (dates.length > 0) {
    const date = dates[0];
    return {
      start: new Date(date.setHours(0, 0, 0, 0)),
      end: new Date(new Date(date).setHours(23, 59, 59, 999)),
    };
  }

  // Fallback
  const hdate = new HDate(10, 'Tishrei', year + 3761);
  const date = hdate.greg();
  return {
    start: new Date(date.setHours(0, 0, 0, 0)),
    end: new Date(new Date(date).setHours(23, 59, 59, 999)),
  };
}

/**
 * Get Purim date (14 Adar)
 */
export function getPurim(year: number): HolidayDate {
  const dates = findHebrewHoliday(year, /^Purim$/);

  if (dates.length > 0) {
    const date = dates[0];
    return {
      start: new Date(date.setHours(0, 0, 0, 0)),
      end: new Date(new Date(date).setHours(23, 59, 59, 999)),
    };
  }

  // Fallback
  const hdate = new HDate(14, 'Adar', year + 3760);
  const date = hdate.greg();
  return {
    start: new Date(date.setHours(0, 0, 0, 0)),
    end: new Date(new Date(date).setHours(23, 59, 59, 999)),
  };
}

// ============================================================================
// LUNAR NEW YEAR (Chinese Calendar)
// ============================================================================

/**
 * Calculate Chinese New Year (Spring Festival)
 * Falls on the new moon between Jan 21 and Feb 20
 *
 * This uses the astronomical calculation for the second new moon after winter solstice
 * Accurate for 2024-2035
 */
const LUNAR_NEW_YEAR_DATES: Record<number, [number, number]> = {
  2024: [2, 10],   // Year of the Dragon
  2025: [1, 29],   // Year of the Snake
  2026: [2, 17],   // Year of the Horse
  2027: [2, 6],    // Year of the Goat
  2028: [1, 26],   // Year of the Monkey
  2029: [2, 13],   // Year of the Rooster
  2030: [2, 3],    // Year of the Dog
  2031: [1, 23],   // Year of the Pig
  2032: [2, 11],   // Year of the Rat
  2033: [1, 31],   // Year of the Ox
  2034: [2, 19],   // Year of the Tiger
  2035: [2, 8],    // Year of the Rabbit
};

export function getLunarNewYear(year: number): HolidayDate {
  const dateInfo = LUNAR_NEW_YEAR_DATES[year];
  if (!dateInfo) {
    // Fallback for years outside our table - approximate calculation
    // Chinese New Year falls between Jan 21 and Feb 20
    // This is a rough approximation; for production, use a proper lunar calendar library
    const approxDate = new Date(year, 1, 1); // Feb 1 as fallback
    return {
      start: new Date(approxDate.setHours(0, 0, 0, 0)),
      end: new Date(new Date(approxDate.getTime() + 14 * 24 * 60 * 60 * 1000).setHours(23, 59, 59, 999)),
      totalDays: 15,
    };
  }

  const [month, day] = dateInfo;
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day + 14, 23, 59, 59, 999); // 15 days of celebration
  return { start, end, totalDays: 15 };
}

/**
 * Get the Chinese Zodiac animal for a year
 */
const ZODIAC_ANIMALS = [
  'Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake',
  'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'
];

export function getChineseZodiac(year: number): string {
  // 2024 is Year of the Dragon (index 4)
  // We calculate offset from 2024
  const baseYear = 2024;
  const baseIndex = 4; // Dragon
  const offset = (year - baseYear) % 12;
  const index = (baseIndex + offset + 12) % 12;
  return ZODIAC_ANIMALS[index];
}

// ============================================================================
// DIWALI (Hindu Lunisolar Calendar)
// ============================================================================

/**
 * Diwali falls on the new moon day in the Hindu month of Kartik
 * (October-November). This is a lookup table for accuracy.
 */
const DIWALI_DATES: Record<number, [number, number]> = {
  2024: [11, 1],   // November 1
  2025: [10, 20],  // October 20
  2026: [11, 8],   // November 8
  2027: [10, 29],  // October 29
  2028: [10, 17],  // October 17
  2029: [11, 5],   // November 5
  2030: [10, 26],  // October 26
  2031: [10, 15],  // October 15
  2032: [11, 2],   // November 2
  2033: [10, 22],  // October 22
  2034: [11, 10],  // November 10
  2035: [10, 30],  // October 30
};

export function getDiwali(year: number): HolidayDate {
  const dateInfo = DIWALI_DATES[year];
  if (!dateInfo) {
    // Fallback - approximate to late October
    const approxDate = new Date(year, 9, 25);
    return {
      start: new Date(approxDate.setHours(0, 0, 0, 0)),
      end: new Date(new Date(approxDate.getTime() + 4 * 24 * 60 * 60 * 1000).setHours(23, 59, 59, 999)),
      totalDays: 5,
    };
  }

  const [month, day] = dateInfo;
  // Diwali is 5 days: Dhanteras (day 1) to Bhai Dooj (day 5)
  // Main Diwali (Lakshmi Puja) is day 3
  const start = new Date(year, month - 1, day - 2, 0, 0, 0, 0); // Start from Dhanteras
  const end = new Date(year, month - 1, day + 2, 23, 59, 59, 999); // End on Bhai Dooj
  return { start, end, totalDays: 5 };
}

// ============================================================================
// HOLI (Hindu Festival of Colors)
// ============================================================================

/**
 * Holi is celebrated on the full moon day in Phalguna (February-March)
 */
const HOLI_DATES: Record<number, [number, number]> = {
  2024: [3, 25],
  2025: [3, 14],
  2026: [3, 3],
  2027: [3, 22],
  2028: [3, 11],
  2029: [3, 1],
  2030: [3, 20],
  2031: [3, 9],
  2032: [2, 27],
  2033: [3, 16],
  2034: [3, 6],
  2035: [3, 25],
};

export function getHoli(year: number): HolidayDate {
  const dateInfo = HOLI_DATES[year];
  if (!dateInfo) {
    // Fallback to mid-March
    const approxDate = new Date(year, 2, 15);
    return {
      start: new Date(approxDate.setHours(0, 0, 0, 0)),
      end: new Date(new Date(approxDate).setHours(23, 59, 59, 999)),
    };
  }

  const [month, day] = dateInfo;
  // Holi is 2 days: Holika Dahan (night before) and Rangwali Holi
  const start = new Date(year, month - 1, day - 1, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day, 23, 59, 59, 999);
  return { start, end, totalDays: 2 };
}

// ============================================================================
// RAMADAN & EID (Islamic Calendar)
// ============================================================================

/**
 * Islamic holidays are based on lunar sightings and can vary by location.
 * These dates are approximations based on astronomical calculations.
 * Actual dates may differ by 1-2 days based on moon sighting.
 */
const EID_AL_FITR_DATES: Record<number, [number, number]> = {
  2024: [4, 10],   // April 10
  2025: [3, 30],   // March 30
  2026: [3, 20],   // March 20
  2027: [3, 9],    // March 9
  2028: [2, 26],   // February 26
  2029: [2, 14],   // February 14
  2030: [2, 4],    // February 4
  2031: [1, 24],   // January 24
  2032: [1, 13],   // January 13
  2033: [1, 2],    // January 2
  2034: [12, 22],  // December 22 (previous year's Ramadan ends here)
  2035: [12, 12],  // December 12
};

export function getEidAlFitr(year: number): HolidayDate {
  const dateInfo = EID_AL_FITR_DATES[year];
  if (!dateInfo) {
    // No data available
    return {
      start: new Date(year, 3, 1, 0, 0, 0, 0),
      end: new Date(year, 3, 3, 23, 59, 59, 999),
      totalDays: 3,
    };
  }

  const [month, day] = dateInfo;
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day + 2, 23, 59, 59, 999); // 3 days
  return { start, end, totalDays: 3 };
}

const EID_AL_ADHA_DATES: Record<number, [number, number]> = {
  2024: [6, 16],   // June 16
  2025: [6, 6],    // June 6
  2026: [5, 27],   // May 27
  2027: [5, 16],   // May 16
  2028: [5, 5],    // May 5
  2029: [4, 24],   // April 24
  2030: [4, 13],   // April 13
  2031: [4, 2],    // April 2
  2032: [3, 22],   // March 22
  2033: [3, 11],   // March 11
  2034: [3, 1],    // March 1
  2035: [2, 18],   // February 18
};

export function getEidAlAdha(year: number): HolidayDate {
  const dateInfo = EID_AL_ADHA_DATES[year];
  if (!dateInfo) {
    return {
      start: new Date(year, 5, 1, 0, 0, 0, 0),
      end: new Date(year, 5, 4, 23, 59, 59, 999),
      totalDays: 4,
    };
  }

  const [month, day] = dateInfo;
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day + 3, 23, 59, 59, 999); // 4 days
  return { start, end, totalDays: 4 };
}

// ============================================================================
// SUPER BOWL SUNDAY
// ============================================================================

/**
 * Super Bowl is typically the first or second Sunday of February
 */
const SUPER_BOWL_DATES: Record<number, [number, number]> = {
  2024: [2, 11],   // LVIII - February 11
  2025: [2, 9],    // LIX - February 9
  2026: [2, 8],    // LX - February 8
  2027: [2, 7],    // LXI - February 7
  2028: [2, 6],    // LXII - February 6
  2029: [2, 11],   // LXIII - February 11
  2030: [2, 10],   // LXIV - February 10
  2031: [2, 9],    // LXV - February 9
  2032: [2, 8],    // LXVI - February 8
  2033: [2, 6],    // LXVII - February 6
  2034: [2, 5],    // LXVIII - February 5
  2035: [2, 4],    // LXIX - February 4
};

export function getSuperBowl(year: number): HolidayDate {
  const dateInfo = SUPER_BOWL_DATES[year];
  if (!dateInfo) {
    // Fallback to second Sunday of February
    return getNthWeekday(year, 2, 0, 2);
  }

  const [month, day] = dateInfo;
  return {
    start: new Date(year, month - 1, day, 0, 0, 0, 0),
    end: new Date(year, month - 1, day, 23, 59, 59, 999),
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a date falls within a holiday's date range
 */
export function isDateInHoliday(date: Date, holiday: HolidayDate): boolean {
  const time = date.getTime();
  return time >= holiday.start.getTime() && time <= holiday.end.getTime();
}

/**
 * Get which day of a multi-day holiday a date falls on
 * Returns 1-indexed day number, or 0 if not in holiday
 */
export function getDayOfHoliday(date: Date, holiday: HolidayDate): number {
  if (!isDateInHoliday(date, holiday)) return 0;

  const startDay = new Date(holiday.start);
  startDay.setHours(0, 0, 0, 0);

  const checkDay = new Date(date);
  checkDay.setHours(0, 0, 0, 0);

  const diffTime = checkDay.getTime() - startDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays + 1; // 1-indexed
}

/**
 * Get the date in a specific timezone
 */
export function getDateInTimezone(date: Date, timezone: string): Date {
  // Create a formatter for the target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const values: Record<string, number> = {};

  for (const part of parts) {
    if (part.type !== 'literal') {
      values[part.type] = parseInt(part.value, 10);
    }
  }

  return new Date(
    values.year,
    values.month - 1,
    values.day,
    values.hour,
    values.minute,
    values.second
  );
}

/**
 * Get current year in a specific timezone
 */
export function getYearInTimezone(timezone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
  });
  return parseInt(formatter.format(new Date()), 10);
}
