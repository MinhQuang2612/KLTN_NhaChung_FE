// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "media", // theo prefers-color-scheme (đúng với globals.css của bạn)
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        accent: "var(--accent)",
        light: "var(--light)",
        soft: "var(--soft)",
        ink: "var(--ink)",
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      container: {
        center: true,
        padding: "1rem",
        screens: { lg: "1024px", xl: "1200px", "2xl": "1320px" },
      },
    },
  },
  plugins: [],
};

export default config;
