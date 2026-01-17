/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // 요정의 숲 테마
        fairy: {
          50: "#f2fcf5",
          100: "#e1f8e8",
          200: "#c3efd4",
          300: "#94e0b7",
          400: "#5cc995",
          500: "#34b079", // Primary Green
          600: "#258f61",
          700: "#1f7250",
          800: "#1a5b42",
          900: "#164b38",
          950: "#0b2920",
        },
        sky: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        // 텍스트용 짙은 숲색 (기존 dark 대체)
        forest: {
          50: "#f4f7f6",
          100: "#e3e9e6",
          200: "#c5d3cd",
          300: "#9eb4ab",
          400: "#779388",
          500: "#5a766b",
          600: "#465d54",
          700: "#394b44",
          800: "#303d38",
          900: "#29332f", // 기본 텍스트
          950: "#1a221f",
        },
        // 호환성을 위해 Primary 유지 (Fairy 500 사용)
        primary: {
          50: "#f2fcf5",
          100: "#e1f8e8",
          200: "#c3efd4",
          300: "#94e0b7",
          400: "#5cc995",
          500: "#34b079",
          600: "#258f61",
          700: "#1f7250",
          800: "#1a5b42",
          900: "#164b38",
          950: "#0b2920",
        },
        // 호환성을 위해 Dark 유지하되 밝은 테마에 맞게 조정 불가능하므로
        // UI 컴포넌트에서 text-dark-xxx를 text-forest-xxx로 교체 예정
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      animation: {
        "slide-up": "slideUp 0.3s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
