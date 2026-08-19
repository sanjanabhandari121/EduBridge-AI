/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16213D",
        paper: "#FBF8F2",
        "paper-dim": "#F3EEE3",
        teal: { DEFAULT: "#157A6E", dark: "#0F5D54", light: "#DCEFEB" },
        marigold: { DEFAULT: "#E8A33D", dark: "#C7822077", light: "#FBECD2" },
        coral: { DEFAULT: "#D65A46", light: "#FBE4DF" },
        slate: { DEFAULT: "#5B6472" },
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(22,33,61,0.04), 0 8px 24px -12px rgba(22,33,61,0.12)",
      },
    },
  },
  plugins: [],
}

