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
        // Warm palette used across modals, cards, and community surfaces.
        // These were referenced throughout the UI but previously undefined,
        // so the classes rendered with no color. Defined here to match the
        // app's warm rose/amber aesthetic.
        terracotta: {
          50: "#fdf3f0",
          100: "#fbe3dc",
          200: "#f6c7b9",
          300: "#eea18a",
          400: "#e27a5c",
          500: "#d65b3c",
          600: "#c2452b",
          700: "#a13624",
          800: "#822f22",
          900: "#6c2a20",
        },
        warm: {
          50: "#faf7f5",
          100: "#f3ece8",
          200: "#e7dad3",
          300: "#d6c2b8",
          400: "#bda293",
          500: "#a48575",
          600: "#8a6d5f",
          700: "#70584d",
          800: "#5c4941",
          900: "#4c3d37",
        },
        sand: {
          50: "#faf8f3",
          100: "#f4efe4",
          200: "#e9dfca",
          300: "#dbcaa8",
          400: "#c9ae82",
          500: "#bb9866",
          600: "#a9835a",
          700: "#8c684c",
          800: "#725544",
          900: "#5e473a",
        },
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
