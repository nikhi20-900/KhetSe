import type { Config } from "tailwindcss";

const config: Config = {
  // Keep the operations workspace consistently light; a dark theme is opt-in
  // through a future explicit class instead of following OS preference.
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        charcoal: {
          DEFAULT: "#0D0F14",
          950: "#07080B",
          900: "#0D0F14",
          850: "#13161C",
          800: "#1A1D24",
          700: "#282D37",
          600: "#434A59",
          500: "#626B7F",
          400: "#8E95A5",
          300: "#B4B9C4",
        },
        linen: {
          DEFAULT: "#F5F4EF",
          50: "#FCFBF9",
          100: "#F5F4EF",
          200: "#EAE7DF",
          300: "#DDD7CD",
          400: "#C8BFB2",
          500: "#AFA494",
        },
        terracotta: {
          DEFAULT: "#F97316",
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
        },
        sage: {
          DEFAULT: "#84A98C",
          50: "#F4F7F5",
          100: "#E5EDE7",
          200: "#C7DACB",
          300: "#A5C2AB",
          400: "#84A98C",
          500: "#648E6E",
          600: "#52796F",
          700: "#3F5E56",
          800: "#2F453F",
          900: "#1E2D29",
        },
        sand: {
          50: "#FAF8F5",
          100: "#F2EFE9",
          200: "#E6E1D7",
          300: "#DDD7CD",
          400: "#C2B9A6",
          500: "#A69B85",
        },
      },
      fontFamily: {
        serif: [
          "Newsreader",
          "Georgia",
          "Cambria",
          "'Times New Roman'",
          "serif",
        ],
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "'JetBrains Mono'",
          "'SFMono-Regular'",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
