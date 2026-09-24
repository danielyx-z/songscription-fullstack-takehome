import type { Config } from "tailwindcss";
import { THEME } from "./src/lib/theme";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: THEME.accent.primary,
          hover: THEME.accent.primaryHover,
          light: THEME.accent.primary,
          dark: THEME.accent.primaryHover,
        },
        accent: {
          primary: THEME.accent.primary,
          primaryHover: THEME.accent.primaryHover,
          primaryLight: THEME.accent.primaryLight,
        },
        secondaryAccent: {
          DEFAULT: THEME.secondary.accent,
          light: THEME.secondary.accentLight,
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
