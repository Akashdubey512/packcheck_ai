/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#0b1329",
          900: "#111c38",
          800: "#1e2e56",
          700: "#2b3f73",
        },
        brand: {
          navy: "#0f172a",
          slate: "#1e293b",
          border: "#e2e8f0",
          surface: "#ffffff",
          subtle: "#f8fafc",
          muted: "#64748b",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Roboto Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(15, 23, 42, 0.05)",
        card: "0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.04)",
        dropdown: "0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -2px rgba(15, 23, 42, 0.05)",
      },
      borderRadius: {
        xs: "2px",
        sm: "4px",
        DEFAULT: "6px",
        md: "6px",
        lg: "8px",
      },
    },
  },
  plugins: [],
};
