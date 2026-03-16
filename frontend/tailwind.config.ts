import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#f8fafc",
          900: "#f1f5f9",
          800: "#e2e8f0",
          700: "#cbd5e1",
          600: "#94a3b8",
        },
        paper: {
          50: "#0f172a",
          100: "#334155",
          200: "#64748b",
        },
        acid: {
          300: "#60a5fa",
          400: "#2563eb",
          500: "#0b5fff",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 18px 38px rgba(11, 95, 255, 0.22)",
        glass: "0 20px 60px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
