/**
 * Colors used throughout the language learning app. 
 * Primary color scheme uses orange (#FF6B00) as the main accent.
 * These are centralized here to maintain consistency.
 */

// Primary brand colors
const primaryColor = '#FF6B00';  // Orange - main accent color
const primaryLight = 'rgba(255, 107, 0, 0.1)';
const primaryDark = '#E05A00';

// Secondary colors
const secondaryColor = '#FFB039';  // Gold/Yellow for streaks/achievements
const secondaryLight = 'rgba(255, 215, 0, 0.15)';

// Neutral colors
const textDark = '#333333';
const textMedium = '#666666';
const textLight = '#999999';
const background = '#F8F9FA';
const cardBackground = '#FFFFFF';

// Status colors
const success = '#2EB67D';
const error = '#E01E5A';
const warning = '#ECB22E';
const info = '#36C5F0';

// Theme configuration
export const Colors = {
  light: {
    text: textDark,
    textSecondary: textMedium,
    textTertiary: textLight,
    background: background,
    cardBackground: cardBackground,
    tint: primaryColor,
    primary: primaryColor,
    primaryLight: primaryLight,
    primaryDark: primaryDark,
    secondary: secondaryColor,
    secondaryLight: secondaryLight,
    icon: textMedium,
    tabIconDefault: textLight,
    tabIconSelected: primaryColor,
    success: success,
    error: error,
    warning: warning,
    info: info,
    progressTrack: '#E0E0E0',
    border: 'rgba(0,0,0,0.03)',
    shadow: 'rgba(0,0,0,0.1)',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    textTertiary: '#687076',
    background: '#151718',
    cardBackground: '#202425',
    tint: primaryColor,
    primary: primaryColor,
    primaryLight: 'rgba(255, 107, 0, 0.2)',
    primaryDark: '#FF8534',
    secondary: secondaryColor,
    secondaryLight: 'rgba(255, 215, 0, 0.25)',
    icon: '#9BA1A6',
    tabIconDefault: '#687076',
    tabIconSelected: primaryColor,
    success: '#2EB67D',
    error: '#E01E5A',
    warning: '#ECB22E',
    info: '#36C5F0',
    progressTrack: '#424546',
    border: 'rgba(255,255,255,0.1)',
    shadow: 'rgba(0,0,0,0.3)',
  },
};

/**
 * Gets the current color scheme (light or dark)
 */
export function getColorScheme() {
  try {
    const stored = typeof window !== 'undefined' && window.localStorage 
      ? localStorage.getItem('theme') 
      : null;
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {}
  return 'light';
}

/**
 * Returns the theme colors for the current color scheme
 */
export function getTheme() {
  return Colors[getColorScheme()];
}

/**
 * Helper function to create opacity variations of colors
 * @param hex The hex color code
 * @param opacity The opacity value (0-1)
 */
export function withOpacity(hex: string, opacity: number): string {
  // Convert hex to RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  // Return rgba string
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}