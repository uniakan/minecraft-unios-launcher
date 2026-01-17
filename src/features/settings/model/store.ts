import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface GameSettings {
  javaPath: string;
  gameDir: string;
  memory: {
    min: number; // MB
    max: number; // MB
  };
  jvmArgs: string[];
  resolution: {
    width: number;
    height: number;
    fullscreen: boolean;
  };
  selectedVersion: string;
}

interface SettingsState {
  settings: GameSettings;
  isLoading: boolean;

  // 액션
  setJavaPath: (path: string) => void;
  setGameDir: (dir: string) => void;
  setMemory: (min: number, max: number) => void;
  setJvmArgs: (args: string[]) => void;
  setResolution: (width: number, height: number, fullscreen: boolean) => void;
  setSelectedVersion: (version: string) => void;
  loadSettings: () => Promise<void>;
  resetSettings: () => void;
}

const defaultSettings: GameSettings = {
  javaPath: "",
  gameDir: "",
  memory: {
    min: 1024,
    max: 4096,
  },
  jvmArgs: [
    "-XX:+UseG1GC",
    "-XX:+ParallelRefProcEnabled",
    "-XX:MaxGCPauseMillis=200",
  ],
  resolution: {
    width: 1280,
    height: 720,
    fullscreen: false,
  },
  selectedVersion: "",
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      isLoading: false,

      setJavaPath: (path) =>
        set((state) => ({
          settings: { ...state.settings, javaPath: path },
        })),

      setGameDir: (dir) =>
        set((state) => ({
          settings: { ...state.settings, gameDir: dir },
        })),

      setMemory: (min, max) =>
        set((state) => ({
          settings: {
            ...state.settings,
            memory: { min, max },
          },
        })),

      setJvmArgs: (args) =>
        set((state) => ({
          settings: { ...state.settings, jvmArgs: args },
        })),

      setResolution: (width, height, fullscreen) =>
        set((state) => ({
          settings: {
            ...state.settings,
            resolution: { width, height, fullscreen },
          },
        })),

      setSelectedVersion: (version) =>
        set((state) => ({
          settings: { ...state.settings, selectedVersion: version },
        })),

      loadSettings: async () => {
        set({ isLoading: true });
        try {
          // 기본 경로 설정
          const minecraftDir = await window.electronAPI.path.getMinecraftDir();
          const javaPaths = await window.electronAPI.java.findPath();

          set((state) => ({
            settings: {
              ...state.settings,
              gameDir: state.settings.gameDir || minecraftDir,
              javaPath: state.settings.javaPath || javaPaths[0] || "",
            },
          }));
        } catch (error) {
          console.error("설정 로드 실패:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      resetSettings: () => set({ settings: defaultSettings }),
    }),
    {
      name: "settings-storage",
    }
  )
);
