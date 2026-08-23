import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95"
        },
        accent: {
          500: "#3b82f6",
          600: "#2563eb"
        }
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)"
      },
      borderRadius: { xl2: "1.25rem" },
      boxShadow: { soft: "0 8px 30px rgba(76, 29, 149, 0.08)" }
    }
  },
  plugins: []
};

export default config;
