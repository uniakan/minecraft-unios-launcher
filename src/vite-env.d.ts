/// <reference types="vite/client" />

interface VersionManifest {
  latest: {
    release: string;
    snapshot: string;
  };
  versions: VersionInfo[];
}

interface VersionInfo {
  id: string;
  type: "release" | "snapshot" | "old_beta" | "old_alpha";
  url: string;
  time: string;
  releaseTime: string;
  sha1: string;
  complianceLevel: number;
}

interface InstallProgress {
  stage: string;
  message: string;
  progress: number;
}

interface ElectronAPI {
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
  };
  fs: {
    readFile: (
      filePath: string
    ) => Promise<{ success: boolean; data?: string; error?: string }>;
    writeFile: (
      filePath: string,
      content: string
    ) => Promise<{ success: boolean; error?: string }>;
    exists: (filePath: string) => Promise<boolean>;
    mkdir: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
    readDir: (
      dirPath: string
    ) => Promise<{ success: boolean; data?: string[]; error?: string }>;
  };
  path: {
    getAppData: () => Promise<string>;
    getMinecraftDir: () => Promise<string>;
    getLauncherDir: () => Promise<string>;
  };
  java: {
    findPath: () => Promise<string[]>;
  };
  minecraft: {
    getVersionManifest: () => Promise<{
      success: boolean;
      data?: VersionManifest;
      error?: string;
    }>;
    getInstalledVersions: (
      gameDir: string
    ) => Promise<{ success: boolean; data?: string[]; error?: string }>;
    installVersion: (options: {
      versionId: string;
      gameDir: string;
    }) => Promise<{ success: boolean; error?: string }>;
    onInstallProgress: (callback: (data: InstallProgress) => void) => void;
    onInstallError: (callback: (data: { error: string }) => void) => void;
    removeInstallListeners: () => void;
  };
  game: {
    launch: (options: {
      javaPath: string;
      gameDir: string;
      version: string;
      username: string;
      uuid: string;
      accessToken: string;
      memoryMin: number;
      memoryMax: number;
      resolution?: { width: number; height: number; fullscreen?: boolean };
    }) => Promise<{ success: boolean; pid?: number; error?: string }>;
    kill: () => Promise<{ success: boolean; error?: string }>;
    isRunning: () => Promise<boolean>;
    onLog: (callback: (data: { type: string; data: string }) => void) => void;
    onExit: (callback: (data: { code: number }) => void) => void;
    onError: (callback: (data: { error: string }) => void) => void;
    removeAllListeners: () => void;
  };
  shell: {
    openExternal: (url: string) => Promise<void>;
  };
  app: {
    getVersion: () => Promise<string>;
    getPlatform: () => Promise<string>;
  };
  auth: {
    microsoftLogin: () => Promise<{
      success: boolean;
      user?: {
        id: string;
        username: string;
        uuid: string;
        accessToken: string;
        refreshToken?: string;
        expiresAt?: number;
        type: 'microsoft';
      };
      error?: string;
    }>;
    refreshToken: (refreshToken: string) => Promise<{
      success: boolean;
      user?: {
        id: string;
        username: string;
        uuid: string;
        accessToken: string;
        refreshToken?: string;
        expiresAt?: number;
        type: 'microsoft';
      };
      error?: string;
    }>;
    onDeviceCode: (callback: (data: { userCode: string; verificationUri: string }) => void) => void;
    removeDeviceCodeListener: () => void;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
