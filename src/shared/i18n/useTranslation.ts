import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ko } from "./locales/ko";
import { en } from "./locales/en";

type Language = "ko" | "en";

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (path: string, params?: Record<string, string | number>) => any;
}

// 중첩 객체 탐색 함수
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getNestedValue = (obj: any, path: string): any => {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj) || path;
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      // 초기 언어 감지: 시스템 언어가 'ko'를 포함하면 한국어, 아니면 영어
      language: navigator.language.includes("ko") ? "ko" : "en",

      setLanguage: (lang) => set({ language: lang }),

      t: (path, params) => {
        const currentLang = get().language;
        const translations = currentLang === "ko" ? ko : en;
        let text = getNestedValue(translations, path);

        if (typeof text !== "string") return text;

        // 파라미터 치환 (ex: {{name}})
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            text = text.replace(new RegExp(`{{${key}}}`, "g"), String(value));
          });
        }

        return text;
      },
    }),
    {
      name: "language-storage",
    }
  )
);

export const useTranslation = () => {
  const { language, setLanguage, t } = useLanguageStore();
  return { language, setLanguage, t };
};
