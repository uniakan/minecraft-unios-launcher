import { create } from "zustand";

export interface GameLog {
  type: "stdout" | "stderr" | "info" | "error";
  message: string;
  timestamp: Date;
}

export type GameStatus =
  | "idle"
  | "preparing"
  | "launching"
  | "running"
  | "error";

interface GameLaunchState {
  status: GameStatus;
  logs: GameLog[];
  progress: number;
  progressMessage: string;
  error: string | null;
  pid: number | null;

  // 액션
  setStatus: (status: GameStatus) => void;
  addLog: (log: Omit<GameLog, "timestamp">) => void;
  clearLogs: () => void;
  setProgress: (progress: number, message?: string) => void;
  setError: (error: string | null) => void;
  setPid: (pid: number | null) => void;
  reset: () => void;
}

export const useGameLaunchStore = create<GameLaunchState>((set) => ({
  status: "idle",
  logs: [],
  progress: 0,
  progressMessage: "",
  error: null,
  pid: null,

  setStatus: (status) => set({ status }),

  addLog: (log) =>
    set((state) => ({
      logs: [...state.logs, { ...log, timestamp: new Date() }].slice(-500), // 최근 500개 로그만 유지
    })),

  clearLogs: () => set({ logs: [] }),

  setProgress: (progress, message) =>
    set({
      progress,
      progressMessage: message || "",
    }),

  setError: (error) =>
    set({
      error,
      status: error ? "error" : "idle",
    }),

  setPid: (pid) => set({ pid }),

  reset: () =>
    set({
      status: "idle",
      progress: 0,
      progressMessage: "",
      error: null,
      pid: null,
    }),
}));
