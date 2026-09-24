// Global Theme Definition
// Strictly 3 color domains as requested:
// 1. Slate / Gray neutrals (background, cards, borders, text)
// 2. Primary Accent (Indigo / Violet)
// 3. Secondary Accent (Rose for favorites / highlights)

export const THEME = {
  bg: {
    base: '#090d16',
    surface: '#0f172a',
    card: '#1e293b',
    border: '#334155',
  },
  accent: {
    primary: '#4BA694',
    primaryHover: '#4f46e5',
    primaryLight: 'rgba(99, 102, 241, 0.15)',
  },
  secondary: {
    accent: '#f43f5e',
    accentLight: 'rgba(244, 63, 94, 0.15)',
  },
} as const;
