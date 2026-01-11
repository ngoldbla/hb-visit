/**
 * Holiday Themes
 *
 * Visual, audio, and quote configurations for each holiday.
 * These themes transform the kiosk experience for seasonal celebrations.
 */

export type ParticleShape =
  | 'circle'
  | 'square'
  | 'star'
  | 'heart'
  | 'snowflake'
  | 'leaf'
  | 'firework'
  | 'egg'
  | 'shamrock'
  | 'pumpkin'
  | 'ghost'
  | 'bat'
  | 'turkey'
  | 'dreidel'
  | 'menorah'
  | 'ornament'
  | 'candy-cane'
  | 'gift'
  | 'dove'
  | 'flag'
  | 'lantern'
  | 'dragon'
  | 'flower'
  | 'butterfly'
  | 'football'
  | 'marigold'
  | 'skull'
  | 'diya'
  | 'coin'
  | 'rainbow';

export type SoundMode = 'replace' | 'layer' | 'default';

export type SoundTheme =
  | 'default'      // R2-D2 beeps
  | 'jingle'       // Sleigh bells, holiday chimes
  | 'spooky'       // Theremin, ghost sounds
  | 'patriotic'    // Fanfare, fireworks
  | 'romantic'     // Harp, gentle tones
  | 'festive'      // Party, celebration
  | 'peaceful'     // Nature, gentle chimes
  | 'drumbeat'     // African/cultural drums
  | 'celtic'       // Irish/Celtic music
  | 'asian'        // Gongs, traditional
  | 'reverent'     // Subdued, respectful;

export interface HolidayTheme {
  // Color palette
  colors: {
    primary: string;      // Main accent color
    secondary: string;    // Secondary color
    accent: string;       // Highlight color
    background: string;   // Background gradient or color
    text: string;         // Text color for overlays
    glow?: string;        // Glow/shadow color
  };

  // Confetti and particle effects
  particles: {
    shapes: ParticleShape[];
    colors: string[];
    count: number;        // Number of particles (default: 80)
    speed?: 'slow' | 'normal' | 'fast';
  };

  // Sound configuration
  sounds: {
    theme: SoundTheme;
    defaultMode: SoundMode; // Default sound mode for this holiday
  };

  // Quote/message customization
  quotes: {
    prefix?: string;      // e.g., "Happy Holidays! "
    suffix?: string;      // e.g., " - Season's Greetings!"
    welcomeOverride?: string; // Override "Welcome back, {name}!"
    categoryFilter?: string[]; // Only show quotes from these categories
  };

  // Visual decorations
  decorations: {
    border?: string;      // CSS border/gradient
    overlay?: string;     // Overlay element (e.g., 'snow', 'hearts', 'leaves')
    iconEmoji?: string;   // Emoji to display in UI
    progressionEmoji?: string[]; // For multi-day holidays (e.g., menorah candles)
  };

  // Respectful mode (for solemn holidays)
  respectful?: boolean;   // If true, use subdued animations
}

// ============================================================================
// THEME DEFINITIONS
// ============================================================================

export const HOLIDAY_THEMES: Record<string, HolidayTheme> = {
  // ==========================================================================
  // JANUARY
  // ==========================================================================
  'new-years-day': {
    colors: {
      primary: '#FFD700',     // Gold
      secondary: '#C0C0C0',   // Silver
      accent: '#000000',      // Black
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      text: '#FFFFFF',
      glow: '#FFD700',
    },
    particles: {
      shapes: ['star', 'circle', 'firework'],
      colors: ['#FFD700', '#C0C0C0', '#FFFFFF', '#E5C100'],
      count: 100,
      speed: 'fast',
    },
    sounds: {
      theme: 'festive',
      defaultMode: 'layer',
    },
    quotes: {
      prefix: 'Happy New Year! ',
      welcomeOverride: 'Welcome to a new year, {name}!',
    },
    decorations: {
      iconEmoji: '🎆',
      overlay: 'fireworks',
    },
  },

  'mlk-day': {
    colors: {
      primary: '#B22234',     // Red
      secondary: '#000000',   // Black
      accent: '#228B22',      // Green
      background: 'linear-gradient(135deg, #2c1810 0%, #1a1a1a 100%)',
      text: '#FFFFFF',
      glow: '#FFD700',
    },
    particles: {
      shapes: ['dove', 'star'],
      colors: ['#FFFFFF', '#FFD700', '#B22234', '#228B22'],
      count: 40,
      speed: 'slow',
    },
    sounds: {
      theme: 'peaceful',
      defaultMode: 'layer',
    },
    quotes: {
      prefix: 'Dream big. ',
      categoryFilter: ['Motivation', 'Leadership'],
    },
    decorations: {
      iconEmoji: '✊',
    },
    respectful: true,
  },

  'lunar-new-year': {
    colors: {
      primary: '#FF0000',     // Red
      secondary: '#FFD700',   // Gold
      accent: '#000000',      // Black
      background: 'linear-gradient(135deg, #8B0000 0%, #FF4500 50%, #FFD700 100%)',
      text: '#FFFFFF',
      glow: '#FF0000',
    },
    particles: {
      shapes: ['lantern', 'dragon', 'coin', 'firework'],
      colors: ['#FF0000', '#FFD700', '#FF4500', '#FFA500'],
      count: 80,
      speed: 'normal',
    },
    sounds: {
      theme: 'asian',
      defaultMode: 'replace',
    },
    quotes: {
      prefix: 'Gong Xi Fa Cai! ',
      welcomeOverride: 'Prosperous wishes, {name}!',
    },
    decorations: {
      iconEmoji: '🧧',
      overlay: 'lanterns',
    },
  },

  // ==========================================================================
  // FEBRUARY
  // ==========================================================================
  'groundhog-day': {
    colors: {
      primary: '#8B4513',     // Brown
      secondary: '#228B22',   // Green
      accent: '#87CEEB',      // Sky blue
      background: 'linear-gradient(135deg, #87CEEB 0%, #90EE90 100%)',
      text: '#333333',
    },
    particles: {
      shapes: ['circle', 'flower'],
      colors: ['#8B4513', '#228B22', '#87CEEB', '#FFFFFF'],
      count: 30,
      speed: 'slow',
    },
    sounds: {
      theme: 'default',
      defaultMode: 'layer',
    },
    quotes: {
      prefix: 'Will you see your shadow? ',
    },
    decorations: {
      iconEmoji: '🦫',
    },
  },

  'super-bowl': {
    colors: {
      primary: '#013369',     // NFL Blue
      secondary: '#D50A0A',   // NFL Red
      accent: '#FFD700',      // Gold
      background: 'linear-gradient(135deg, #1a472a 0%, #013369 100%)',
      text: '#FFFFFF',
      glow: '#FFD700',
    },
    particles: {
      shapes: ['football', 'star'],
      colors: ['#013369', '#D50A0A', '#FFD700', '#8B4513'],
      count: 60,
      speed: 'fast',
    },
    sounds: {
      theme: 'festive',
      defaultMode: 'layer',
    },
    quotes: {
      prefix: 'Game Day! ',
    },
    decorations: {
      iconEmoji: '🏈',
    },
  },

  'valentines-day': {
    colors: {
      primary: '#FF69B4',     // Hot pink
      secondary: '#FF0000',   // Red
      accent: '#FFB6C1',      // Light pink
      background: 'linear-gradient(135deg, #FFE4E1 0%, #FFB6C1 50%, #FF69B4 100%)',
      text: '#8B0000',
      glow: '#FF69B4',
    },
    particles: {
      shapes: ['heart', 'flower', 'circle'],
      colors: ['#FF69B4', '#FF0000', '#FFB6C1', '#FFFFFF', '#B8860B'],
      count: 80,
      speed: 'slow',
    },
    sounds: {
      theme: 'romantic',
      defaultMode: 'layer',
    },
    quotes: {
      prefix: 'Spread the love! ',
      welcomeOverride: 'We love having you, {name}!',
    },
    decorations: {
      iconEmoji: '💕',
      overlay: 'hearts',
    },
  },

  'presidents-day': {
    colors: {
      primary: '#002868',     // Blue
      secondary: '#BF0A30',   // Red
      accent: '#FFFFFF',      // White
      background: 'linear-gradient(135deg, #002868 0%, #FFFFFF 50%, #BF0A30 100%)',
      text: '#002868',
    },
    particles: {
      shapes: ['star', 'flag'],
      colors: ['#002868', '#BF0A30', '#FFFFFF'],
      count: 50,
      speed: 'normal',
    },
    sounds: {
      theme: 'patriotic',
      defaultMode: 'layer',
    },
    quotes: {
      categoryFilter: ['Leadership'],
    },
    decorations: {
      iconEmoji: '🦅',
    },
  },

  // ==========================================================================
  // MARCH
  // ==========================================================================
  'purim': {
    colors: {
      primary: '#9400D3',     // Purple
      secondary: '#FFD700',   // Gold
      accent: '#00CED1',      // Teal
      background: 'linear-gradient(135deg, #9400D3 0%, #FFD700 100%)',
      text: '#FFFFFF',
    },
    particles: {
      shapes: ['star', 'circle', 'triangle' as ParticleShape],
      colors: ['#9400D3', '#FFD700', '#00CED1', '#FF69B4'],
      count: 70,
      speed: 'fast',
    },
    sounds: {
      theme: 'festive',
      defaultMode: 'layer',
    },
    quotes: {
      prefix: 'Chag Purim! ',
    },
    decorations: {
      iconEmoji: '🎭',
    },
  },

  'holi': {
    colors: {
      primary: '#FF1493',     // Deep pink
      secondary: '#00FF00',   // Lime
      accent: '#FFD700',      // Gold
      background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 25%, #FFE66D 50%, #FF6B6B 75%, #95E1D3 100%)',
      text: '#333333',
    },
    particles: {
      shapes: ['circle', 'star'],
      colors: ['#FF1493', '#00FF00', '#FFD700', '#FF4500', '#9400D3', '#00CED1', '#FF69B4'],
      count: 120,
      speed: 'fast',
    },
    sounds: {
      theme: 'festive',
      defaultMode: 'replace',
    },
    quotes: {
      prefix: 'Festival of Colors! ',
      welcomeOverride: 'Color your day, {name}!',
    },
    decorations: {
      iconEmoji: '🎨',
      overlay: 'colors',
    },
  },

  'st-patricks-day': {
    colors: {
      primary: '#228B22',     // Forest green
      secondary: '#FFD700',   // Gold
      accent: '#FFFFFF',      // White
      background: 'linear-gradient(135deg, #228B22 0%, #32CD32 50%, #FFD700 100%)',
      text: '#FFFFFF',
      glow: '#228B22',
    },
    particles: {
      shapes: ['shamrock', 'coin', 'rainbow'],
      colors: ['#228B22', '#32CD32', '#FFD700', '#FFFFFF'],
      count: 70,
      speed: 'normal',
    },
    sounds: {
      theme: 'celtic',
      defaultMode: 'layer',
    },
    quotes: {
      prefix: 'May luck be with you! ',
    },
    decorations: {
      iconEmoji: '☘️',
      overlay: 'shamrocks',
    },
  },

  // ==========================================================================
  // MARCH/APRIL (Variable)
  // ==========================================================================
  'passover': {
    colors: {
      primary: '#4169E1',     // Royal blue
      secondary: '#FFFFFF',   // White
      accent: '#FFD700',      // Gold
      background: 'linear-gradient(135deg, #4169E1 0%, #FFFFFF 50%, #E6E6FA 100%)',
      text: '#4169E1',
    },
    particles: {
      shapes: ['star', 'flower'],
      colors: ['#4169E1', '#FFFFFF', '#FFD700', '#9400D3'],
      count: 50,
      speed: 'slow',
    },
    sounds: {
      theme: 'peaceful',
      defaultMode: 'layer',
    },
    quotes: {
      prefix: 'Chag Pesach Sameach! ',
    },
    decorations: {
      iconEmoji: '✡️',
      progressionEmoji: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'],
    },
  },

  'good-friday': {
    colors: {
      primary: '#4B0082',     // Indigo
      secondary: '#8B4513',   // Saddle brown
      accent: '#FFFFFF',
      background: 'linear-gradient(135deg, #4B0082 0%, #2F1B41 100%)',
      text: '#FFFFFF',
    },
    particles: {
      shapes: ['dove', 'flower'],
      colors: ['#FFFFFF', '#4B0082', '#FFD700'],
      count: 30,
      speed: 'slow',
    },
    sounds: {
      theme: 'reverent',
      defaultMode: 'layer',
    },
    quotes: {
      prefix: 'Peace be with you. ',
    },
    decorations: {
      iconEmoji: '✝️',
    },
    respectful: true,
  },

  'easter': {
    colors: {
      primary: '#FF69B4',     // Hot pink
      secondary: '#FFFF00',   // Yellow
      accent: '#87CEEB',      // Sky blue
      background: 'linear-gradient(135deg, #E6E6FA 0%, #FFB6C1 25%, #FFFACD 50%, #98FB98 75%, #87CEEB 100%)',
      text: '#4B0082',
    },
    particles: {
      shapes: ['egg', 'flower', 'butterfly'],
      colors: ['#FF69B4', '#FFFF00', '#87CEEB', '#98FB98', '#E6E6FA', '#FFA500'],
      count: 80,
      speed: 'normal',
    },
    sounds: {
      theme: 'peaceful',
      defaultMode: 'layer',
    },
    quotes: {
      prefix: 'Spring into action! ',
      welcomeOverride: 'Hoppy to see you, {name}!',
    },
    decorations: {
      iconEmoji: '🐰',
      overlay: 'eggs',
    },
  },

  'eid-al-fitr': {
    colors: {
      primary: '#228B22',     // Green
      secondary: '#FFD700',   // Gold
      accent: '#FFFFFF',
      background: 'linear-gradient(135deg, #228B22 0%, #FFD700 100%)',
      text: '#FFFFFF',
    },
    particles: {
      shapes: ['star', 'circle', 'firework'],
      colors: ['#228B22', '#FFD700', '#FFFFFF', '#C0C0C0'],
      count: 70,
      speed: 'normal',
    },
    sounds: {
      theme: 'festive',
      defaultMode: 'layer',
    },
    quotes: {
      prefix: 'Eid Mubarak! ',
      welcomeOverride: 'Blessed Eid, {name}!',
    },
    decorations: {
      iconEmoji: '🌙',
      progressionEmoji: ['1️⃣', '2️⃣', '3️⃣'],
    },
  },

  // ==========================================================================
  // APRIL
  // ==========================================================================
  'earth-day': {
    colors: {
      primary: '#228B22',     // Forest green
      secondary: '#4169E1',   // Royal blue
      accent: '#8B4513',      // Saddle brown
      background: 'linear-gradient(135deg, #87CEEB 0%, #90EE90 50%, #228B22 100%)',
      text: '#006400',
    },
    particles: {
      shapes: ['leaf', 'flower', 'butterfly'],
      colors: ['#228B22', '#4169E1', '#8B4513', '#90EE90', '#87CEEB'],
      count: 60,
      speed: 'slow',
    },
    sounds: {
      theme: 'peaceful',
      defaultMode: 'layer',
    },
    quotes: {
      prefix: 'Love our planet! ',
      categoryFilter: ['Innovation'],
    },
    decorations: {
      iconEmoji: '🌍',
      overlay: 'leaves',
    },
  },

  // ==========================================================================
  // MAY
  // ==========================================================================
  'cinco-de-mayo': {
    colors: {
      primary: '#006847',     // Green (Mexican flag)
      secondary: '#CE1126',   // Red (Mexican flag)
      accent: '#FFFFFF',
      background: 'linear-gradient(135deg, #006847 0%, #FFFFFF 50%, #CE1126 100%)',
      text: '#FFFFFF',
    },
    particles: {
      shapes: ['star', 'flower', 'circle'],
      colors: ['#006847', '#CE1126', '#FFD700', '#FF69B4', '#00CED1'],
      count: 80,
      speed: 'fast',
    },
    sounds: {
      theme: 'festive',
      defaultMode: 'replace',
    },
    quotes: {
      prefix: '¡Viva la fiesta! ',
    },
    decorations: {
      iconEmoji: '🎉',
    },
  },

  'mothers-day': {
    colors: {
      primary: '#FF69B4',     // Hot pink
      secondary: '#E6E6FA',   // Lavender
      accent: '#98FB98',      // Pale green
      background: 'linear-gradient(135deg, #FFE4E1 0%, #E6E6FA 50%, #FFB6C1 100%)',
      text: '#8B008B',
    },
    particles: {
      shapes: ['flower', 'heart', 'butterfly'],
      colors: ['#FF69B4', '#E6E6FA', '#98FB98', '#FFB6C1', '#FFFFFF'],
      count: 70,
      speed: 'slow',
    },
    sounds: {
      theme: 'romantic',
      defaultMode: 'layer',
    },
    quotes: {
      prefix: 'Celebrating all moms! ',
      categoryFilter: ['Motivation', 'Success'],
    },
    decorations: {
      iconEmoji: '💐',
      overlay: 'flowers',
    },
  },

  'memorial-day': {
    colors: {
      primary: '#002868',     // Blue
      secondary: '#BF0A30',   // Red
      accent: '#FFFFFF',
      background: 'linear-gradient(135deg, #002868 0%, #1a1a2e 100%)',
      text: '#FFFFFF',
    },
    particles: {
      shapes: ['star', 'flag', 'flower'],
      colors: ['#002868', '#BF0A30', '#FFFFFF'],
      count: 40,
      speed: 'slow',
    },
    sounds: {
      theme: 'reverent',
      defaultMode: 'layer',
    },
    quotes: {
      prefix: 'We remember. ',
      categoryFilter: ['Leadership', 'Persistence'],
    },
    decorations: {
      iconEmoji: '🇺🇸',
    },
    respectful: true,
  },

  // ==========================================================================
  // JUNE
  // ==========================================================================
  'eid-al-adha': {
    colors: {
      primary: '#228B22',
      secondary: '#FFD700',
      accent: '#FFFFFF',
      background: 'linear-gradient(135deg, #228B22 0%, #006400 100%)',
      text: '#FFFFFF',
    },
    particles: {
      shapes: ['star', 'circle'],
      colors: ['#228B22', '#FFD700', '#FFFFFF', '#C0C0C0'],
      count: 60,
      speed: 'normal',
    },
    sounds: {
      theme: 'festive',
      defaultMode: 'layer',
    },
    quotes: {
      prefix: 'Eid Mubarak! ',
    },
    decorations: {
      iconEmoji: '🕌',
      progressionEmoji: ['1️⃣', '2️⃣', '3️⃣', '4️⃣'],
    },
  },

  'fathers-day': {
    colors: {
      primary: '#4169E1',     // Royal blue
      secondary: '#228B22',   // Forest green
      accent: '#8B4513',      // Brown
      background: 'linear-gradient(135deg, #4169E1 0%, #2F4F4F 100%)',
      text: '#FFFFFF',
    },
    particles: {
      shapes: ['star', 'circle'],
      colors: ['#4169E1', '#228B22', '#FFD700', '#8B4513'],
      count: 50,
      speed: 'normal',
    },
    sounds: {
      theme: 'default',
      defaultMode: 'layer',
    },
    quotes: {
      prefix: 'Celebrating all dads! ',
      categoryFilter: ['Leadership', 'Motivation'],
    },
    decorations: {
      iconEmoji: '👔',
    },
  },

  'juneteenth': {
    colors: {
      primary: '#BF0A30',     // Red
      secondary: '#000000',   // Black
      accent: '#228B22',      // Green
      background: 'linear-gradient(135deg, #BF0A30 0%, #000000 50%, #228B22 100%)',
      text: '#FFFFFF',
      glow: '#FFD700',
    },
    particles: {
      shapes: ['star', 'firework'],
      colors: ['#BF0A30', '#228B22', '#FFD700', '#FFFFFF'],
      count: 80,
      speed: 'normal',
    },
    sounds: {
      theme: 'festive',
      defaultMode: 'layer',
    },
    quotes: {
      prefix: 'Freedom Day! ',
    },
    decorations: {
      iconEmoji: '✊🏿',
    },
  },

  // ==========================================================================
  // JULY
  // ==========================================================================
  'independence-day': {
    colors: {
      primary: '#BF0A30',     // Red
      secondary: '#002868',   // Blue
      accent: '#FFFFFF',
      background: 'linear-gradient(135deg, #002868 0%, #1a1a2e 50%, #BF0A30 100%)',
      text: '#FFFFFF',
      glow: '#FFD700',
    },
    particles: {
      shapes: ['star', 'firework', 'flag'],
      colors: ['#BF0A30', '#002868', '#FFFFFF', '#FFD700'],
      count: 100,
      speed: 'fast',
    },
    sounds: {
      theme: 'patriotic',
      defaultMode: 'replace',
    },
    quotes: {
      prefix: 'Happy 4th! ',
      welcomeOverride: 'Land of the free, {name}!',
    },
    decorations: {
      iconEmoji: '🎆',
      overlay: 'fireworks',
    },
  },

  'bastille-day': {
    colors: {
      primary: '#002395',     // French blue
      secondary: '#ED2939',   // French red
      accent: '#FFFFFF',
      background: 'linear-gradient(135deg, #002395 0%, #FFFFFF 50%, #ED2939 100%)',
      text: '#002395',
    },
    particles: {
      shapes: ['star', 'circle'],
      colors: ['#002395', '#ED2939', '#FFFFFF'],
      count: 70,
      speed: 'normal',
    },
    sounds: {
      theme: 'festive',
      defaultMode: 'layer',
    },
    quotes: {
      prefix: 'Vive la France! ',
    },
    decorations: {
      iconEmoji: '🇫🇷',
    },
  },

  // ==========================================================================
  // SEPTEMBER
  // ==========================================================================
  'labor-day': {
    colors: {
      primary: '#1E90FF',     // Dodger blue (denim)
      secondary: '#BF0A30',   // Red
      accent: '#FFD700',      // Gold
      background: 'linear-gradient(135deg, #1E90FF 0%, #2F4F4F 100%)',
      text: '#FFFFFF',
    },
    particles: {
      shapes: ['star', 'circle'],
      colors: ['#1E90FF', '#BF0A30', '#FFD700', '#FFFFFF'],
      count: 50,
      speed: 'normal',
    },
    sounds: {
      theme: 'festive',
      defaultMode: 'layer',
    },
    quotes: {
      prefix: 'Hard work pays off! ',
      categoryFilter: ['Motivation', 'Success'],
    },
    decorations: {
      iconEmoji: '⚒️',
    },
  },

  'rosh-hashanah': {
    colors: {
      primary: '#FFFFFF',     // White
      secondary: '#FFD700',   // Gold
      accent: '#4169E1',      // Royal blue
      background: 'linear-gradient(135deg, #FFFFFF 0%, #FFFACD 50%, #FFD700 100%)',
      text: '#4169E1',
    },
    particles: {
      shapes: ['star', 'circle'],
      colors: ['#FFFFFF', '#FFD700', '#4169E1', '#FFA500'],
      count: 50,
      speed: 'slow',
    },
    sounds: {
      theme: 'peaceful',
      defaultMode: 'layer',
    },
    quotes: {
      prefix: 'L\'Shanah Tovah! ',
      welcomeOverride: 'Sweet new year, {name}!',
    },
    decorations: {
      iconEmoji: '🍎',
      progressionEmoji: ['1️⃣', '2️⃣'],
    },
  },

  'yom-kippur': {
    colors: {
      primary: '#FFFFFF',
      secondary: '#C0C0C0',   // Silver
      accent: '#FFD700',      // Gold (subtle)
      background: 'linear-gradient(135deg, #FFFFFF 0%, #E8E8E8 100%)',
      text: '#333333',
    },
    particles: {
      shapes: ['dove', 'star'],
      colors: ['#FFFFFF', '#C0C0C0', '#E8E8E8'],
      count: 20,
      speed: 'slow',
    },
    sounds: {
      theme: 'reverent',
      defaultMode: 'layer',
    },
    quotes: {
      prefix: 'G\'mar Chatimah Tovah. ',
    },
    decorations: {
      iconEmoji: '🕊️',
    },
    respectful: true,
  },

  // ==========================================================================
  // OCTOBER
  // ==========================================================================
  'indigenous-peoples-day': {
    colors: {
      primary: '#CD853F',     // Peru (terracotta)
      secondary: '#40E0D0',   // Turquoise
      accent: '#9ACD32',      // Yellow green (sage)
      background: 'linear-gradient(135deg, #CD853F 0%, #DEB887 50%, #40E0D0 100%)',
      text: '#8B4513',
    },
    particles: {
      shapes: ['leaf', 'flower'],
      colors: ['#CD853F', '#40E0D0', '#9ACD32', '#FF7F50'],
      count: 50,
      speed: 'slow',
    },
    sounds: {
      theme: 'drumbeat',
      defaultMode: 'layer',
    },
    quotes: {
      prefix: 'Honoring all cultures. ',
    },
    decorations: {
      iconEmoji: '🪶',
    },
    respectful: true,
  },

  'diwali': {
    colors: {
      primary: '#FFD700',     // Gold
      secondary: '#FF4500',   // Orange red
      accent: '#9400D3',      // Purple
      background: 'linear-gradient(135deg, #FFD700 0%, #FF4500 50%, #9400D3 100%)',
      text: '#FFFFFF',
      glow: '#FFD700',
    },
    particles: {
      shapes: ['diya', 'firework', 'star'],
      colors: ['#FFD700', '#FF4500', '#9400D3', '#FF69B4', '#00CED1'],
      count: 100,
      speed: 'fast',
    },
    sounds: {
      theme: 'festive',
      defaultMode: 'replace',
    },
    quotes: {
      prefix: 'Happy Diwali! ',
      welcomeOverride: 'May light guide you, {name}!',
    },
    decorations: {
      iconEmoji: '🪔',
      overlay: 'diyas',
      progressionEmoji: ['🪔', '🪔🪔', '🪔🪔🪔', '🪔🪔🪔🪔', '🪔🪔🪔🪔🪔'],
    },
  },

  'halloween': {
    colors: {
      primary: '#FF6600',     // Orange
      secondary: '#000000',   // Black
      accent: '#9400D3',      // Purple
      background: 'linear-gradient(135deg, #000000 0%, #1a0a2e 50%, #2d1b4e 100%)',
      text: '#FF6600',
      glow: '#9400D3',
    },
    particles: {
      shapes: ['pumpkin', 'ghost', 'bat', 'star'],
      colors: ['#FF6600', '#9400D3', '#00FF00', '#FFFFFF'],
      count: 80,
      speed: 'normal',
    },
    sounds: {
      theme: 'spooky',
      defaultMode: 'replace',
    },
    quotes: {
      prefix: 'Spooky season! ',
      welcomeOverride: 'Boo-tiful to see you, {name}!',
    },
    decorations: {
      iconEmoji: '🎃',
      overlay: 'spiderwebs',
    },
  },

  // ==========================================================================
  // NOVEMBER
  // ==========================================================================
  'day-of-the-dead': {
    colors: {
      primary: '#FF6600',     // Marigold orange
      secondary: '#000000',   // Black
      accent: '#FF1493',      // Deep pink
      background: 'linear-gradient(135deg, #000000 0%, #2d0a3e 50%, #FF6600 100%)',
      text: '#FFFFFF',
    },
    particles: {
      shapes: ['skull', 'marigold', 'flower'],
      colors: ['#FF6600', '#FF1493', '#40E0D0', '#9400D3', '#FFFFFF'],
      count: 70,
      speed: 'slow',
    },
    sounds: {
      theme: 'festive',
      defaultMode: 'layer',
    },
    quotes: {
      prefix: 'Celebrating life. ',
    },
    decorations: {
      iconEmoji: '💀',
      overlay: 'marigolds',
      progressionEmoji: ['💀', '💀💀'],
    },
  },

  'veterans-day': {
    colors: {
      primary: '#002868',
      secondary: '#BF0A30',
      accent: '#FFFFFF',
      background: 'linear-gradient(135deg, #002868 0%, #1a1a2e 100%)',
      text: '#FFFFFF',
    },
    particles: {
      shapes: ['star', 'flag', 'flower'],
      colors: ['#002868', '#BF0A30', '#FFFFFF'],
      count: 40,
      speed: 'slow',
    },
    sounds: {
      theme: 'reverent',
      defaultMode: 'layer',
    },
    quotes: {
      prefix: 'Thank you for your service. ',
    },
    decorations: {
      iconEmoji: '🎖️',
    },
    respectful: true,
  },

  'thanksgiving': {
    colors: {
      primary: '#FF6600',     // Orange
      secondary: '#8B4513',   // Saddle brown
      accent: '#FFD700',      // Gold
      background: 'linear-gradient(135deg, #8B4513 0%, #CD853F 50%, #FF6600 100%)',
      text: '#FFFFFF',
    },
    particles: {
      shapes: ['leaf', 'turkey', 'pumpkin'],
      colors: ['#FF6600', '#8B4513', '#FFD700', '#8B0000', '#228B22'],
      count: 70,
      speed: 'slow',
    },
    sounds: {
      theme: 'peaceful',
      defaultMode: 'layer',
    },
    quotes: {
      prefix: 'Grateful for you! ',
      welcomeOverride: 'Thankful for you, {name}!',
    },
    decorations: {
      iconEmoji: '🦃',
      overlay: 'leaves',
    },
  },

  // ==========================================================================
  // DECEMBER
  // ==========================================================================
  'hanukkah': {
    colors: {
      primary: '#4169E1',     // Royal blue
      secondary: '#FFFFFF',   // White
      accent: '#C0C0C0',      // Silver
      background: 'linear-gradient(135deg, #4169E1 0%, #1a1a4e 50%, #FFFFFF 100%)',
      text: '#FFFFFF',
      glow: '#FFD700',
    },
    particles: {
      shapes: ['dreidel', 'menorah', 'star', 'coin'],
      colors: ['#4169E1', '#FFFFFF', '#C0C0C0', '#FFD700'],
      count: 70,
      speed: 'normal',
    },
    sounds: {
      theme: 'festive',
      defaultMode: 'layer',
    },
    quotes: {
      prefix: 'Chag Sameach! ',
      welcomeOverride: 'Festival of Lights, {name}!',
    },
    decorations: {
      iconEmoji: '🕎',
      // Progression shows menorah candles for each night
      progressionEmoji: ['🕯️', '🕯️🕯️', '🕯️🕯️🕯️', '🕯️🕯️🕯️🕯️', '🕯️🕯️🕯️🕯️🕯️', '🕯️🕯️🕯️🕯️🕯️🕯️', '🕯️🕯️🕯️🕯️🕯️🕯️🕯️', '🕯️🕯️🕯️🕯️🕯️🕯️🕯️🕯️'],
    },
  },

  'christmas-eve': {
    colors: {
      primary: '#228B22',     // Forest green
      secondary: '#BF0A30',   // Red
      accent: '#FFD700',      // Gold
      background: 'linear-gradient(135deg, #0a2e1a 0%, #1a3a2a 50%, #0a2e1a 100%)',
      text: '#FFFFFF',
    },
    particles: {
      shapes: ['snowflake', 'star', 'ornament'],
      colors: ['#228B22', '#BF0A30', '#FFD700', '#FFFFFF', '#C0C0C0'],
      count: 60,
      speed: 'slow',
    },
    sounds: {
      theme: 'jingle',
      defaultMode: 'layer',
    },
    quotes: {
      prefix: '\'Twas the night before... ',
    },
    decorations: {
      iconEmoji: '🌟',
      overlay: 'snow',
    },
  },

  'christmas': {
    colors: {
      primary: '#BF0A30',     // Red
      secondary: '#228B22',   // Green
      accent: '#FFD700',      // Gold
      background: 'linear-gradient(135deg, #0a2e1a 0%, #1a3a2a 50%, #2d0a1a 100%)',
      text: '#FFFFFF',
      glow: '#FFD700',
    },
    particles: {
      shapes: ['snowflake', 'ornament', 'candy-cane', 'gift', 'star'],
      colors: ['#BF0A30', '#228B22', '#FFD700', '#FFFFFF', '#C0C0C0'],
      count: 100,
      speed: 'normal',
    },
    sounds: {
      theme: 'jingle',
      defaultMode: 'replace',
    },
    quotes: {
      prefix: 'Merry Christmas! ',
      welcomeOverride: 'Ho ho ho, {name}!',
    },
    decorations: {
      iconEmoji: '🎄',
      overlay: 'snow',
    },
  },

  'kwanzaa': {
    colors: {
      primary: '#BF0A30',     // Red
      secondary: '#000000',   // Black
      accent: '#228B22',      // Green
      background: 'linear-gradient(135deg, #BF0A30 0%, #000000 50%, #228B22 100%)',
      text: '#FFFFFF',
    },
    particles: {
      shapes: ['star', 'circle'],
      colors: ['#BF0A30', '#000000', '#228B22', '#FFD700'],
      count: 60,
      speed: 'slow',
    },
    sounds: {
      theme: 'drumbeat',
      defaultMode: 'layer',
    },
    quotes: {
      prefix: 'Habari Gani! ',
    },
    decorations: {
      iconEmoji: '🕯️',
      // Seven principles, seven candles
      progressionEmoji: ['Umoja', 'Kujichagulia', 'Ujima', 'Ujamaa', 'Nia', 'Kuumba', 'Imani'],
    },
  },

  'new-years-eve': {
    colors: {
      primary: '#FFD700',     // Gold
      secondary: '#C0C0C0',   // Silver
      accent: '#000000',      // Black
      background: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d4e 50%, #0a0a1e 100%)',
      text: '#FFFFFF',
      glow: '#FFD700',
    },
    particles: {
      shapes: ['star', 'firework', 'circle'],
      colors: ['#FFD700', '#C0C0C0', '#FFFFFF', '#FF69B4'],
      count: 100,
      speed: 'fast',
    },
    sounds: {
      theme: 'festive',
      defaultMode: 'replace',
    },
    quotes: {
      prefix: 'Ring in the new year! ',
      welcomeOverride: 'Cheers to you, {name}!',
    },
    decorations: {
      iconEmoji: '🥂',
      overlay: 'fireworks',
    },
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get theme for a holiday by ID
 */
export function getHolidayTheme(holidayId: string): HolidayTheme | undefined {
  return HOLIDAY_THEMES[holidayId];
}

/**
 * Get default theme (for non-holiday days)
 */
export function getDefaultTheme(): HolidayTheme {
  return {
    colors: {
      primary: '#ffc421',     // HatchBridge gold
      secondary: '#ff9d00',
      accent: '#2153ff',
      background: 'linear-gradient(135deg, #fff9e9 0%, #fffdf5 100%)',
      text: '#000824',
    },
    particles: {
      shapes: ['circle', 'square', 'star'],
      colors: ['#ffc421', '#ff9d00', '#ffaa00', '#2153ff'],
      count: 80,
    },
    sounds: {
      theme: 'default',
      defaultMode: 'default',
    },
    quotes: {},
    decorations: {},
  };
}

/**
 * Apply quote prefix/suffix if set in theme
 */
export function applyQuoteTransform(
  quote: string,
  theme: HolidayTheme
): string {
  const prefix = theme.quotes.prefix || '';
  const suffix = theme.quotes.suffix || '';
  return `${prefix}${quote}${suffix}`;
}

/**
 * Apply welcome message override if set
 */
export function getWelcomeMessage(
  name: string,
  theme: HolidayTheme
): string {
  const template = theme.quotes.welcomeOverride || 'Welcome back, {name}!';
  return template.replace('{name}', name);
}

/**
 * Get progression emoji for current day of multi-day holiday
 */
export function getProgressionEmoji(
  theme: HolidayTheme,
  dayOfHoliday: number
): string | undefined {
  const emojis = theme.decorations.progressionEmoji;
  if (!emojis || emojis.length === 0) return undefined;

  // Day is 1-indexed, array is 0-indexed
  const index = Math.min(dayOfHoliday - 1, emojis.length - 1);
  return emojis[index];
}
