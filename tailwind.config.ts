import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pokemon: {
          yellow: "#ffcb05",
          "yellow-light": "#fff4cc",
          "yellow-dark": "#c7a008",
          blue: "#3c5aa6",
          "blue-light": "#5c7cbd",
          "blue-muted": "#e8ecf4",
          dark: "#1a1a2e",
          "dark-muted": "#2d2d44",
        },
        semantic: {
          success: "#16a34a",
          "success-light": "#dcfce7",
          error: "#dc2626",
          "error-light": "#fee2e2",
          warning: "#d97706",
          "warning-light": "#fffbeb",
        },
      },
      borderRadius: {
        card: "16px",
        button: "12px",
        input: "10px",
        badge: "9999px",
      },
      boxShadow: {
        card: "0 2px 8px rgba(26, 26, 46, 0.06), 0 1px 2px rgba(26, 26, 46, 0.04)",
        "card-hover":
          "0 8px 24px rgba(26, 26, 46, 0.08), 0 2px 6px rgba(26, 26, 46, 0.04)",
        "card-hover-cute":
          "0 12px 32px rgba(26, 26, 46, 0.12), 0 4px 12px rgba(255, 203, 5, 0.08)",
      },
      fontFamily: {
        display: ["var(--font-nunito)", "system-ui", "sans-serif"],
        sans: ["var(--font-nunito)", "system-ui", "sans-serif"],
        brand: ["var(--font-fredoka)", "var(--font-quicksand)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
