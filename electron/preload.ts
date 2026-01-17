import { contextBridge, ipcRenderer } from 'electron'

// Renderer 프로세스에서 사용할 API 정의
const electronAPI = {
  // 창 제어
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
  },

  // 파일 시스템
  fs: {
    readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
    writeFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:writeFile', filePath, content),
    exists: (filePath: string) => ipcRenderer.invoke('fs:exists', filePath),
    mkdir: (dirPath: string) => ipcRenderer.invoke('fs:mkdir', dirPath),
    readDir: (dirPath: string) => ipcRenderer.invoke('fs:readDir', dirPath),
  },

  // 경로
  path: {
    getAppData: () => ipcRenderer.invoke('path:getAppData'),
    getMinecraftDir: () => ipcRenderer.invoke('path:getMinecraftDir'),
    getLauncherDir: () => ipcRenderer.invoke('path:getLauncherDir'),
  },

  // Java
  java: {
    findPath: () => ipcRenderer.invoke('java:findPath'),
  },

  // Minecraft 버전 관리
  minecraft: {
    getVersionManifest: () => ipcRenderer.invoke('minecraft:getVersionManifest'),
    getInstalledVersions: (gameDir: string) => ipcRenderer.invoke('minecraft:getInstalledVersions', gameDir),
    installVersion: (options: { versionId: string; gameDir: string }) =>
      ipcRenderer.invoke('minecraft:installVersion', options),
    deleteVersion: (options: { versionId: string; gameDir: string }) =>
      ipcRenderer.invoke('minecraft:deleteVersion', options),
    onInstallProgress: (callback: (data: { stage: string; message: string; progress: number }) => void) => {
      ipcRenderer.on('install:progress', (_, data) => callback(data))
    },
    onInstallError: (callback: (data: { error: string }) => void) => {
      ipcRenderer.on('install:error', (_, data) => callback(data))
    },
    removeInstallListeners: () => {
      ipcRenderer.removeAllListeners('install:progress')
      ipcRenderer.removeAllListeners('install:error')
    },
  },

  // 게임
  game: {
    launch: (options: {
      javaPath: string
      gameDir: string
      version: string
      username: string
      uuid: string
      accessToken: string
      memoryMin: number
      memoryMax: number
      resolution?: { width: number; height: number; fullscreen?: boolean }
    }) => ipcRenderer.invoke('game:launch', options),
    kill: () => ipcRenderer.invoke('game:kill'),
    isRunning: () => ipcRenderer.invoke('game:isRunning'),
    onLog: (callback: (data: { type: string; data: string }) => void) => {
      ipcRenderer.on('game:log', (_, data) => callback(data))
    },
    onExit: (callback: (data: { code: number }) => void) => {
      ipcRenderer.on('game:exit', (_, data) => callback(data))
    },
    onError: (callback: (data: { error: string }) => void) => {
      ipcRenderer.on('game:error', (_, data) => callback(data))
    },
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('game:log')
      ipcRenderer.removeAllListeners('game:exit')
      ipcRenderer.removeAllListeners('game:error')
    },
  },

  // 셸
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
    openPath: (path: string) => ipcRenderer.invoke('shell:openPath', path),
  },

  // 앱
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getPlatform: () => ipcRenderer.invoke('app:getPlatform'),
  },

  // 인증
  auth: {
    microsoftLogin: () => ipcRenderer.invoke('auth:microsoftLogin'),
    refreshToken: (refreshToken: string) => ipcRenderer.invoke('auth:refreshToken', refreshToken),
    onDeviceCode: (callback: (data: { userCode: string; verificationUri: string }) => void) => {
      ipcRenderer.on('auth:deviceCode', (_, data) => callback(data))
    },
    removeDeviceCodeListener: () => {
      ipcRenderer.removeAllListeners('auth:deviceCode')
    },
  },

  // 서버 상태
  server: {
    ping: (host?: string, port?: number) => ipcRenderer.invoke('server:ping', host, port),
    getDefault: () => ipcRenderer.invoke('server:getDefault'),
  },

  // 모드 관리
  mods: {
    scan: (gameDir: string) => ipcRenderer.invoke('mods:scan', gameDir),
    toggle: (gameDir: string, filename: string) => ipcRenderer.invoke('mods:toggle', gameDir, filename),
  },

  // 셰이더 관리
  shaders: {
    scan: (gameDir: string) => ipcRenderer.invoke('shaders:scan', gameDir),
    toggle: (gameDir: string, filename: string) => ipcRenderer.invoke('shaders:toggle', gameDir, filename),
  },
}

// 렌더러 프로세스에 API 노출
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export type ElectronAPI = typeof electronAPI
