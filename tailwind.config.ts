import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bảng màu hiện đại chuẩn MediCare Mobile UI
        slate: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
        // Bảng màu thương hiệu "An" — theo logo mới (kim la bàn cam, vòng xanh lá, ghim định vị xanh navy)
        blue: {
          50: "#EEF3F7",
          100: "#DCE7F0",
          200: "#B9D0E3",
          300: "#8FB1CC",
          400: "#4F83A8",
          500: "#326688",
          600: "#245471",
          700: "#173A56",
          800: "#122C42",
          900: "#0E2438",
        },
        medical: {
          blue: "#173A56",   // Ghim định vị navy — màu hành động chính
          hover: "#0E2438",
          light: "#EEF3F7",  // Subtle card highlight
          accent: "#245471", // Navy accent
        },
        navy: {
          800: "#1E293B",
          900: "#0F172A",
          700: "#173A56",
        },
        emergency: {
          DEFAULT: "#EF4444",
          dark: "#DC2626",
          bg: "#FEF2F2",
          border: "#FCA5A5",
        }
      },
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'md': '8px',
        'lg': '10px',
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        'elevated': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.03)',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};

export default config;
