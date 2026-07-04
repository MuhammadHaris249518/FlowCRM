import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f1efff",
          100: "#e3dfff",
          200: "#c3baff",
          300: "#a091ff",
          400: "#7f66ff",
          500: "#6238f2", // primary indigo/violet — matches homepage CTA
          600: "#4f2ad1",
          700: "#3f21a8",
          800: "#2f1980",
          900: "#211158",
        },
        ink: {
          900: "#0f1222",
          700: "#3a3f52",
          500: "#6b7089",
          300: "#a6aabd",
        },
        surface: {
          DEFAULT: "#ffffff",
          muted: "#f7f7fb",
          border: "#ececf3",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 18, 34, 0.04), 0 8px 24px rgba(15, 18, 34, 0.06)",
        panel: "0 20px 60px rgba(98, 56, 242, 0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
