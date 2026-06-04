import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        graphite: {
          50: "#f7f7f5",
          100: "#e8e4dd",
          200: "#cfc6b7",
          500: "#6b6256",
          700: "#393530",
          900: "#171513"
        },
        gold: {
          100: "#f8edcf",
          300: "#e7c46e",
          500: "#c99a2e",
          700: "#8b6619"
        },
        clay: "#a55f4a",
        moss: "#6f7f68",
        ink: "#101010"
      },
      boxShadow: {
        soft: "0 24px 70px rgba(23, 21, 19, 0.12)"
      },
      fontFamily: {
        sans: ["Inter", "Manrope", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
