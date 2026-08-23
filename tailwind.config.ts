import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        tfl: {
          gold: "#C99326",
          "gold-hover": "#B3801D",
          "gold-light": "#FBBF24",
          "gold-soft": "#FEF9EE",
          "gold-border": "#F3D48D",
          slate: {
            950: "#090D16",
            900: "#0F172A",
            800: "#1E293B",
            700: "#334155",
            600: "#475569",
            500: "#64748B",
            400: "#94A3B8",
            100: "#F1F5F9",
            50: "#F8FAFC",
          },
          sage: {
            DEFAULT: "#10B981",
            soft: "#ECFDF5",
            dark: "#047857",
          },
          rose: {
            DEFAULT: "#F43F5E",
            soft: "#FFF1F2",
            dark: "#BE123C",
          },
          sand: "#FAF9F6",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
export default config;
