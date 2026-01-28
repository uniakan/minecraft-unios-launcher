import { app, BrowserWindow, ipcMain, shell } from "electron";
import { join } from "path";
import { spawn, ChildProcess } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";
import * as crypto from "crypto";
import {
  getVersionManifest,
  getVersionDetails,
  getAssetIndex,
  downloadFile,
  buildClasspath,
  buildJvmArgs,
  buildGameArgs,
  shouldIncludeLibrary,
  getNativeClassifier,
  DownloadProgress,
  VersionManifest,
  VersionDetails,
  VersionInfo,
} from "./minecraft-core";
import {
  getNeoForgeVersions,
  getLatestNeoForgeVersion,
  downloadNeoForgeVersion,
  buildNeoForgeClasspath,
  mergeVersionDetails,
  NeoForgeVersion,
} from "./neoforge-core";
import * as zlib from "zlib";

let mainWindow: BrowserWindow | null = null;
let gameProcess: ChildProcess | null = null;
let authServer: http.Server | null = null;

// 버전 캐시
let versionManifestCache: VersionManifest | null = null;

// Microsoft OAuth 설정 (Device Code Flow)
// Prism Launcher 공개 Client ID (Azure AD 등록됨)
const MS_CLIENT_ID = "c36a9fb6-4f2a-41ff-90bd-ae7cc92031eb";
const MS_SCOPES = "XboxLive.signin offline_access";

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    frame: false,
    titleBarStyle: "hidden",
    transparent: false,
    backgroundColor: "#f0fdf4",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, "preload.js"),
    },
    icon: join(__dirname, "../public/icon.png"),
  });

  if (process.env.NODE_ENV === "development" || !app.isPackaged) {
    mainWindow.loadURL("http://localhost:5175");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// =====================
// 유틸리티 함수
// =====================

function sendProgress(event: string, data: any) {
  mainWindow?.webContents.send(event, data);
}

// =====================
// IPC 핸들러
// =====================

// 창 제어
ipcMain.handle("window:minimize", () => mainWindow?.minimize());
ipcMain.handle("window:maximize", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.handle("window:close", () => mainWindow?.close());

// 파일 시스템
ipcMain.handle("fs:readFile", async (_, filePath: string) => {
  try {
    const content = await fs.promises.readFile(filePath, "utf-8");
    return { success: true, data: content };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("fs:writeFile", async (_, filePath: string, content: string) => {
  try {
    await fs.promises.writeFile(filePath, content, "utf-8");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("fs:exists", async (_, filePath: string) =>
  fs.existsSync(filePath)
);

ipcMain.handle("fs:mkdir", async (_, dirPath: string) => {
  try {
    await fs.promises.mkdir(dirPath, { recursive: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("fs:readDir", async (_, dirPath: string) => {
  try {
    const files = await fs.promises.readdir(dirPath);
    return { success: true, data: files };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// 경로 유틸리티
ipcMain.handle("path:getAppData", () => app.getPath("appData"));

ipcMain.handle("path:getMinecraftDir", () => {
  const platform = process.platform;
  const appData = app.getPath("appData");

  if (platform === "win32") {
    return path.join(appData, ".minecraft");
  } else if (platform === "darwin") {
    return path.join(
      app.getPath("home"),
      "Library",
      "Application Support",
      "minecraft"
    );
  } else {
    return path.join(app.getPath("home"), ".minecraft");
  }
});

ipcMain.handle("path:getLauncherDir", () =>
  path.join(app.getPath("appData"), "unios-minecraft-launcher")
);

// Java 경로 탐색
ipcMain.handle("java:findPath", async () => {
  const platform = process.platform;
  let javaPaths: string[] = [];

  if (platform === "win32") {
    const programFiles = process.env["ProgramFiles"] || "C:\\Program Files";
    const programFilesX86 =
      process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
    const javaHome = process.env["JAVA_HOME"];

    if (javaHome) {
      javaPaths.push(path.join(javaHome, "bin", "java.exe"));
    }

    const searchDirs = [
      path.join(programFiles, "Java"),
      path.join(programFilesX86, "Java"),
      path.join(programFiles, "Eclipse Adoptium"),
      path.join(programFiles, "Microsoft"),
      path.join(programFiles, "Zulu"),
      path.join(app.getPath("appData"), ".minecraft", "runtime"),
    ];

    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        try {
          const entries = await fs.promises.readdir(dir, {
            withFileTypes: true,
          });
          for (const entry of entries) {
            if (entry.isDirectory()) {
              const javaPath = path.join(dir, entry.name, "bin", "java.exe");
              if (fs.existsSync(javaPath)) {
                javaPaths.push(javaPath);
              }
              // Check nested structure (Mojang runtime format)
              const nestedPath = path.join(dir, entry.name, "bin", "java.exe");
              if (
                fs.existsSync(nestedPath) &&
                !javaPaths.includes(nestedPath)
              ) {
                javaPaths.push(nestedPath);
              }
            }
          }
        } catch (e) {
          // Ignore directory read errors
        }
      }
    }
  } else if (platform === "darwin") {
    const javaHome = process.env["JAVA_HOME"];
    if (javaHome) javaPaths.push(path.join(javaHome, "bin", "java"));
    javaPaths.push("/usr/bin/java");
  } else {
    const javaHome = process.env["JAVA_HOME"];
    if (javaHome) javaPaths.push(path.join(javaHome, "bin", "java"));
    javaPaths.push("/usr/bin/java");
  }

  return javaPaths.filter((p) => fs.existsSync(p));
});

// =====================
// Minecraft 버전 관리
// =====================

// 버전 매니페스트 가져오기
ipcMain.handle("minecraft:getVersionManifest", async () => {
  try {
    if (!versionManifestCache) {
      versionManifestCache = await getVersionManifest();
    }
    return { success: true, data: versionManifestCache };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// 설치된 버전 목록
ipcMain.handle("minecraft:getInstalledVersions", async (_, gameDir: string) => {
  try {
    const versionsDir = path.join(gameDir, "versions");
    if (!fs.existsSync(versionsDir)) {
      return { success: true, data: [] };
    }

    const entries = await fs.promises.readdir(versionsDir, {
      withFileTypes: true,
    });
    const installed: string[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const versionJson = path.join(
          versionsDir,
          entry.name,
          `${entry.name}.json`
        );
        const versionJar = path.join(
          versionsDir,
          entry.name,
          `${entry.name}.jar`
        );
        if (fs.existsSync(versionJson) && fs.existsSync(versionJar)) {
          installed.push(entry.name);
        }
      }
    }

    return { success: true, data: installed };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// 버전 설치
ipcMain.handle(
  "minecraft:installVersion",
  async (
    event,
    options: {
      versionId: string;
      gameDir: string;
    }
  ) => {
    const { versionId, gameDir } = options;

    try {
      sendProgress("install:progress", {
        stage: "manifest",
        message: "버전 정보 가져오는 중...",
        progress: 0,
      });

      // 1. 버전 매니페스트 가져오기
      if (!versionManifestCache) {
        versionManifestCache = await getVersionManifest();
      }

      const versionInfo = versionManifestCache.versions.find(
        (v) => v.id === versionId
      );
      if (!versionInfo) {
        throw new Error(`버전 ${versionId}을 찾을 수 없습니다.`);
      }

      // 2. 버전 상세 정보 가져오기
      sendProgress("install:progress", {
        stage: "details",
        message: "버전 상세 정보 가져오는 중...",
        progress: 5,
      });
      const versionDetails = await getVersionDetails(versionInfo);

      // 3. 버전 디렉토리 생성
      const versionDir = path.join(gameDir, "versions", versionId);
      await fs.promises.mkdir(versionDir, { recursive: true });

      // 4. 버전 JSON 저장
      const versionJsonPath = path.join(versionDir, `${versionId}.json`);
      await fs.promises.writeFile(
        versionJsonPath,
        JSON.stringify(versionDetails, null, 2)
      );

      // 5. 클라이언트 JAR 다운로드
      sendProgress("install:progress", {
        stage: "client",
        message: "클라이언트 다운로드 중...",
        progress: 10,
      });
      const clientJarPath = path.join(versionDir, `${versionId}.jar`);

      if (!fs.existsSync(clientJarPath)) {
        await downloadFile(
          versionDetails.downloads.client.url,
          clientJarPath,
          (p) => {
            sendProgress("install:progress", {
              stage: "client",
              message: `클라이언트 다운로드 중... ${p.percentage}%`,
              progress: 10 + p.percentage * 0.2,
            });
          }
        );
      }

      // 6. 라이브러리 다운로드
      const librariesDir = path.join(gameDir, "libraries");
      const totalLibraries = versionDetails.libraries.filter((l) =>
        shouldIncludeLibrary(l)
      ).length;
      let downloadedLibraries = 0;

      for (const library of versionDetails.libraries) {
        if (!shouldIncludeLibrary(library)) continue;

        if (library.downloads?.artifact) {
          const libPath = path.join(
            librariesDir,
            library.downloads.artifact.path
          );

          if (!fs.existsSync(libPath)) {
            sendProgress("install:progress", {
              stage: "libraries",
              message: `라이브러리 다운로드 중: ${library.name}`,
              progress: 30 + (downloadedLibraries / totalLibraries) * 30,
            });

            await downloadFile(library.downloads.artifact.url, libPath);
          }
        }

        // Native 라이브러리 다운로드
        if (library.natives && library.downloads?.classifiers) {
          const nativeClassifier =
            library.natives[
              process.platform === "win32"
                ? "windows"
                : process.platform === "darwin"
                ? "osx"
                : "linux"
            ];

          if (
            nativeClassifier &&
            library.downloads.classifiers[nativeClassifier]
          ) {
            const nativeArtifact =
              library.downloads.classifiers[nativeClassifier];
            const nativePath = path.join(librariesDir, nativeArtifact.path);

            if (!fs.existsSync(nativePath)) {
              await downloadFile(nativeArtifact.url, nativePath);
            }
          }
        }

        downloadedLibraries++;
      }

      // 7. 에셋 다운로드
      sendProgress("install:progress", {
        stage: "assets",
        message: "에셋 인덱스 가져오는 중...",
        progress: 60,
      });

      const assetsDir = path.join(gameDir, "assets");
      const assetIndexDir = path.join(assetsDir, "indexes");
      await fs.promises.mkdir(assetIndexDir, { recursive: true });

      const assetIndexPath = path.join(
        assetIndexDir,
        `${versionDetails.assetIndex.id}.json`
      );

      // 에셋 인덱스 다운로드
      if (!fs.existsSync(assetIndexPath)) {
        await downloadFile(versionDetails.assetIndex.url, assetIndexPath);
      }

      const assetIndex = JSON.parse(
        await fs.promises.readFile(assetIndexPath, "utf-8")
      );
      const assetObjects = Object.entries(assetIndex.objects) as [
        string,
        { hash: string; size: number }
      ][];
      const totalAssets = assetObjects.length;
      let downloadedAssets = 0;

      const objectsDir = path.join(assetsDir, "objects");

      for (const [, asset] of assetObjects) {
        const hash = asset.hash;
        const hashPrefix = hash.substring(0, 2);
        const assetPath = path.join(objectsDir, hashPrefix, hash);

        if (!fs.existsSync(assetPath)) {
          const assetUrl = `https://resources.download.minecraft.net/${hashPrefix}/${hash}`;
          await downloadFile(assetUrl, assetPath);
        }

        downloadedAssets++;
        if (downloadedAssets % 100 === 0 || downloadedAssets === totalAssets) {
          sendProgress("install:progress", {
            stage: "assets",
            message: `에셋 다운로드 중: ${downloadedAssets}/${totalAssets}`,
            progress: 60 + (downloadedAssets / totalAssets) * 35,
          });
        }
      }

      sendProgress("install:progress", {
        stage: "done",
        message: "설치 완료!",
        progress: 100,
      });

      return { success: true };
    } catch (error) {
      sendProgress("install:error", { error: (error as Error).message });
      return { success: false, error: (error as Error).message };
    }
  }
);

// 버전 삭제
ipcMain.handle(
  "minecraft:deleteVersion",
  async (event, options: { versionId: string; gameDir: string }) => {
    const { versionId, gameDir } = options;
    const versionDir = path.join(gameDir, "versions", versionId);

    try {
      if (fs.existsSync(versionDir)) {
        await fs.promises.rm(versionDir, { recursive: true, force: true });
        return { success: true };
      } else {
        return { success: false, error: "버전 폴더가 존재하지 않습니다." };
      }
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
);

// =====================
// 게임 실행
// =====================

ipcMain.handle(
  "game:launch",
  async (
    event,
    options: {
      javaPath: string;
      gameDir: string;
      version: string;
      username: string;
      uuid: string;
      accessToken: string;
      memoryMin: number;
      memoryMax: number;
      resolution?: { width: number; height: number; fullscreen?: boolean };
    }
  ) => {
    const {
      javaPath,
      gameDir,
      version,
      username,
      uuid,
      accessToken,
      memoryMin,
      memoryMax,
      resolution,
    } = options;

    try {
      // 버전 JSON 읽기
      const versionJsonPath = path.join(
        gameDir,
        "versions",
        version,
        `${version}.json`
      );
      if (!fs.existsSync(versionJsonPath)) {
        return {
          success: false,
          error: `버전 ${version}이 설치되어 있지 않습니다.`,
        };
      }

      const versionDetails: VersionDetails = JSON.parse(
        await fs.promises.readFile(versionJsonPath, "utf-8")
      );

      // Natives 추출
      const nativesDir = path.join(gameDir, "versions", version, "natives");
      await fs.promises.mkdir(nativesDir, { recursive: true });

      // Native 라이브러리 추출 (JAR에서 DLL/SO/DYLIB 추출)
      const librariesDir = path.join(gameDir, "libraries");
      for (const library of versionDetails.libraries) {
        if (!shouldIncludeLibrary(library)) continue;
        if (!library.natives) continue;

        const osKey =
          process.platform === "win32"
            ? "windows"
            : process.platform === "darwin"
            ? "osx"
            : "linux";

        const nativeClassifier = library.natives[osKey];
        if (!nativeClassifier) continue;

        if (library.downloads?.classifiers?.[nativeClassifier]) {
          const nativeArtifact =
            library.downloads.classifiers[nativeClassifier];
          const nativeJarPath = path.join(librariesDir, nativeArtifact.path);

          if (fs.existsSync(nativeJarPath)) {
            // JAR 파일에서 native 파일 추출
            await extractNatives(
              nativeJarPath,
              nativesDir,
              library.extract?.exclude || []
            );
          }
        }
      }

      // Classpath 빌드
      const classpath = buildClasspath(versionDetails, gameDir, version);

      if (classpath.length === 0) {
        return {
          success: false,
          error: "라이브러리를 찾을 수 없습니다. 버전을 다시 설치해주세요.",
        };
      }

      // JVM 인자 빌드
      const jvmArgs = buildJvmArgs(
        versionDetails,
        gameDir,
        version,
        nativesDir,
        classpath,
        memoryMin,
        memoryMax
      );

      // 게임 인자 빌드
      const assetsDir = path.join(gameDir, "assets");
      const gameArgs = buildGameArgs(
        versionDetails,
        gameDir,
        version,
        assetsDir,
        username,
        uuid,
        accessToken,
        resolution
      );

      // Main class
      const mainClass = versionDetails.mainClass;

      // 전체 인자 조합
      const allArgs = [...jvmArgs, mainClass, ...gameArgs];

      console.log("Launching with args:", javaPath, allArgs.join(" "));

      // 게임 프로세스 실행
      gameProcess = spawn(javaPath, allArgs, {
        cwd: gameDir,
        detached: false,
        stdio: ["ignore", "pipe", "pipe"],
      });

      gameProcess.stdout?.on("data", (data) => {
        const lines = data.toString().split("\n");
        for (const line of lines) {
          if (line.trim()) {
            mainWindow?.webContents.send("game:log", {
              type: "stdout",
              data: line,
            });
          }
        }
      });

      gameProcess.stderr?.on("data", (data) => {
        const lines = data.toString().split("\n");
        for (const line of lines) {
          if (line.trim()) {
            mainWindow?.webContents.send("game:log", {
              type: "stderr",
              data: line,
            });
          }
        }
      });

      gameProcess.on("close", (code) => {
        mainWindow?.webContents.send("game:exit", { code });
        gameProcess = null;
      });

      gameProcess.on("error", (error) => {
        mainWindow?.webContents.send("game:error", { error: error.message });
        gameProcess = null;
      });

      return { success: true, pid: gameProcess.pid };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
);

// Native 파일 추출 (JAR에서)
async function extractNatives(
  jarPath: string,
  destDir: string,
  exclude: string[]
): Promise<void> {
  const AdmZip = require("adm-zip");

  try {
    const zip = new AdmZip(jarPath);
    const entries = zip.getEntries();

    for (const entry of entries) {
      if (entry.isDirectory) continue;

      const entryName = entry.entryName;

      // 제외 패턴 확인
      if (exclude.some((pattern) => entryName.startsWith(pattern))) continue;

      // DLL, SO, DYLIB 파일만 추출
      if (
        entryName.endsWith(".dll") ||
        entryName.endsWith(".so") ||
        entryName.endsWith(".dylib") ||
        entryName.endsWith(".jnilib")
      ) {
        const destPath = path.join(destDir, path.basename(entryName));
        if (!fs.existsSync(destPath)) {
          zip.extractEntryTo(entry, destDir, false, true);
        }
      }
    }
  } catch (error) {
    console.error("Native 추출 오류:", error);
  }
}

ipcMain.handle("game:kill", () => {
  if (gameProcess) {
    gameProcess.kill();
    gameProcess = null;
    return { success: true };
  }
  return { success: false, error: "실행 중인 게임이 없습니다." };
});

ipcMain.handle("game:isRunning", () => gameProcess !== null);

// 외부 링크
ipcMain.handle("shell:openExternal", async (_, url: string) => {
  await shell.openExternal(url);
});

// 파일/폴더 열기
ipcMain.handle("shell:openPath", async (_, path: string) => {
  return await shell.openPath(path);
});

// 앱 정보
ipcMain.handle("app:getVersion", () => app.getVersion());
ipcMain.handle("app:getPlatform", () => process.platform);

// =====================
// Microsoft 인증
// =====================

// HTTPS 요청 헬퍼
function httpsRequest(
  url: string,
  options: https.RequestOptions,
  postData?: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request(
      {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        ...options,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        });
      }
    );
    req.on("error", reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// Device Code 요청
async function requestDeviceCode(): Promise<{
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}> {
  const params = new URLSearchParams({
    client_id: MS_CLIENT_ID,
    scope: MS_SCOPES,
  });

  return httpsRequest(
    "https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
    params.toString()
  );
}

// Device Code로 토큰 폴링
async function pollForToken(deviceCode: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const params = new URLSearchParams({
    client_id: MS_CLIENT_ID,
    grant_type: "urn:ietf:params:oauth:grant-type:device_code",
    device_code: deviceCode,
  });

  return httpsRequest(
    "https://login.microsoftonline.com/consumers/oauth2/v2.0/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
    params.toString()
  );
}

// Microsoft OAuth 로그인 시작 (Device Code Flow)
ipcMain.handle("auth:microsoftLogin", async () => {
  try {
    // 1. Device Code 요청
    console.log("Requesting device code...");
    const deviceCodeResponse = await requestDeviceCode();
    console.log("Device code response:", deviceCodeResponse);

    if (!deviceCodeResponse.user_code || !deviceCodeResponse.device_code) {
      console.error("Invalid device code response:", deviceCodeResponse);
      return {
        success: false,
        error: deviceCodeResponse.error_description || deviceCodeResponse.error || "Device code 요청 실패",
      };
    }

    // 2. 사용자에게 코드 표시 및 브라우저 열기
    mainWindow?.webContents.send("auth:deviceCode", {
      userCode: deviceCodeResponse.user_code,
      verificationUri: deviceCodeResponse.verification_uri,
    });

    // 브라우저에서 인증 페이지 열기
    shell.openExternal(deviceCodeResponse.verification_uri);

    // 3. 토큰 폴링 (사용자가 인증할 때까지)
    const interval = (deviceCodeResponse.interval || 5) * 1000;
    const expiresAt = Date.now() + deviceCodeResponse.expires_in * 1000;

    let msTokens: { access_token: string; refresh_token: string; expires_in: number } | null = null;

    while (Date.now() < expiresAt) {
      await new Promise((resolve) => setTimeout(resolve, interval));

      try {
        const response = await pollForToken(deviceCodeResponse.device_code);
        console.log("Poll response:", response);

        if (response.access_token) {
          msTokens = response;
          break;
        }

        // 에러 응답 처리
        if (response.error === "authorization_pending") {
          continue;
        }
        if (response.error === "slow_down") {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue;
        }
        if (response.error) {
          return { success: false, error: response.error_description || response.error };
        }
      } catch (err: any) {
        console.error("Poll error:", err);
        continue;
      }
    }

    if (!msTokens) {
      return { success: false, error: "로그인 시간이 초과되었습니다." };
    }

    console.log("Got MS tokens, authenticating with Xbox Live...");

    // 4. Xbox Live 인증
    const xblToken = await authenticateXboxLive(msTokens.access_token);
    console.log("Xbox Live auth response:", xblToken);

    if (!xblToken.Token) {
      return { success: false, error: "Xbox Live 인증 실패" };
    }

    // 5. XSTS 토큰 획득
    const xstsToken = await authenticateXSTS(xblToken.Token);
    console.log("XSTS response:", xstsToken);

    if (!xstsToken.Token) {
      // XSTS 에러 처리
      const xstsError = xstsToken as any;
      if (xstsError.XErr) {
        const errorMessages: Record<number, string> = {
          2148916233: "Microsoft 계정이 Xbox 계정에 연결되어 있지 않습니다. Xbox.com에서 계정을 설정해주세요.",
          2148916235: "Xbox Live가 사용 불가능한 국가입니다.",
          2148916236: "성인 인증이 필요합니다 (한국).",
          2148916238: "18세 미만은 부모 동의가 필요합니다.",
        };
        return {
          success: false,
          error: errorMessages[xstsError.XErr] || `Xbox 인증 실패 (${xstsError.XErr})`,
        };
      }
      return { success: false, error: "XSTS 토큰 획득 실패" };
    }

    // 6. Minecraft 인증
    const mcAuth = await authenticateMinecraft(
      xstsToken.DisplayClaims.xui[0].uhs,
      xstsToken.Token
    );
    console.log("Minecraft auth response:", mcAuth);

    if (!mcAuth.access_token) {
      return { success: false, error: "Minecraft 인증 실패" };
    }

    // 7. Minecraft 프로필 가져오기
    const profile = await getMinecraftProfile(mcAuth.access_token);
    console.log("Minecraft profile:", profile);

    if (!profile.id || !profile.name) {
      // 게임을 소유하지 않은 경우
      if ((profile as any).error === "NOT_FOUND") {
        return { success: false, error: "이 계정은 Minecraft를 소유하고 있지 않습니다." };
      }
      return { success: false, error: "Minecraft 프로필을 가져올 수 없습니다." };
    }

    return {
      success: true,
      user: {
        id: profile.id,
        username: profile.name,
        uuid: profile.id,
        accessToken: mcAuth.access_token,
        refreshToken: msTokens.refresh_token,
        expiresAt: Date.now() + mcAuth.expires_in * 1000,
        type: "microsoft",
      },
    };
  } catch (error: any) {
    console.error("Microsoft login error:", error);
    return { success: false, error: error?.message || "로그인에 실패했습니다." };
  }
});

// Microsoft 토큰 갱신
async function refreshMsToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const params = new URLSearchParams({
    client_id: MS_CLIENT_ID,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
    scope: MS_SCOPES,
  });

  return httpsRequest(
    "https://login.microsoftonline.com/consumers/oauth2/v2.0/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
    params.toString()
  );
}

// Xbox Live 인증
async function authenticateXboxLive(msAccessToken: string): Promise<{
  Token: string;
  DisplayClaims: { xui: { uhs: string }[] };
}> {
  const body = JSON.stringify({
    Properties: {
      AuthMethod: "RPS",
      SiteName: "user.auth.xboxlive.com",
      RpsTicket: `d=${msAccessToken}`,
    },
    RelyingParty: "http://auth.xboxlive.com",
    TokenType: "JWT",
  });

  return httpsRequest(
    "https://user.auth.xboxlive.com/user/authenticate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
    body
  );
}

// XSTS 토큰 인증
async function authenticateXSTS(xblToken: string): Promise<{
  Token: string;
  DisplayClaims: { xui: { uhs: string }[] };
}> {
  const body = JSON.stringify({
    Properties: {
      SandboxId: "RETAIL",
      UserTokens: [xblToken],
    },
    RelyingParty: "rp://api.minecraftservices.com/",
    TokenType: "JWT",
  });

  return httpsRequest(
    "https://xsts.auth.xboxlive.com/xsts/authorize",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
    body
  );
}

// Minecraft 인증
async function authenticateMinecraft(
  userHash: string,
  xstsToken: string
): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const body = JSON.stringify({
    identityToken: `XBL3.0 x=${userHash};${xstsToken}`,
  });

  return httpsRequest(
    "https://api.minecraftservices.com/authentication/login_with_xbox",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
    body
  );
}

// Minecraft 프로필 가져오기
async function getMinecraftProfile(
  accessToken: string
): Promise<{ id: string; name: string }> {
  return httpsRequest(
    "https://api.minecraftservices.com/minecraft/profile",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
}

// 토큰 갱신
ipcMain.handle(
  "auth:refreshToken",
  async (_, refreshToken: string): Promise<any> => {
    try {
      // 1. Microsoft 토큰 갱신
      const msTokens = await refreshMsToken(refreshToken);

      // 2. Xbox Live 인증
      const xblToken = await authenticateXboxLive(msTokens.access_token);

      // 3. XSTS 토큰 획득
      const xstsToken = await authenticateXSTS(xblToken.Token);

      // 4. Minecraft 인증
      const mcAuth = await authenticateMinecraft(
        xstsToken.DisplayClaims.xui[0].uhs,
        xstsToken.Token
      );

      // 5. Minecraft 프로필 가져오기
      const profile = await getMinecraftProfile(mcAuth.access_token);

      return {
        success: true,
        user: {
          id: profile.id,
          username: profile.name,
          uuid: profile.id,
          accessToken: mcAuth.access_token,
          refreshToken: msTokens.refresh_token,
          expiresAt: Date.now() + mcAuth.expires_in * 1000,
          type: "microsoft",
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
);

// =====================
// Minecraft 서버 상태 조회 (Server List Ping)
// =====================

import * as net from "net";
import * as dns from "dns";

const DEFAULT_SERVER = {
  host: "hardy-unios-server.uniakan.com",
  port: 25565,
};

interface ServerStatus {
  online: boolean;
  host: string;
  port: number;
  version?: {
    name: string;
    protocol: number;
  };
  players?: {
    online: number;
    max: number;
    sample?: { name: string; id: string }[];
  };
  description?: string;
  favicon?: string;
  ping?: number;
  error?: string;
}

// SRV 레코드 조회 (mc.example.com -> 실제 서버 주소)
async function resolveSRV(host: string): Promise<{ host: string; port: number }> {
  return new Promise((resolve) => {
    dns.resolveSrv(`_minecraft._tcp.${host}`, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        resolve({ host, port: DEFAULT_SERVER.port });
      } else {
        resolve({ host: addresses[0].name, port: addresses[0].port });
      }
    });
  });
}

// VarInt 인코딩
function writeVarInt(value: number): Buffer {
  const bytes: number[] = [];
  while (true) {
    if ((value & ~0x7f) === 0) {
      bytes.push(value);
      break;
    }
    bytes.push((value & 0x7f) | 0x80);
    value >>>= 7;
  }
  return Buffer.from(bytes);
}

// VarInt 디코딩
function readVarInt(buffer: Buffer, offset: number): { value: number; size: number } {
  let value = 0;
  let size = 0;
  let byte: number;

  do {
    byte = buffer[offset + size];
    value |= (byte & 0x7f) << (7 * size);
    size++;
    if (size > 5) throw new Error("VarInt too big");
  } while ((byte & 0x80) !== 0);

  return { value, size };
}

// Minecraft Server List Ping
async function pingMinecraftServer(
  host: string = DEFAULT_SERVER.host,
  port: number = DEFAULT_SERVER.port,
  timeout: number = 5000
): Promise<ServerStatus> {
  // SRV 레코드 확인
  const resolved = await resolveSRV(host);
  const actualHost = resolved.host;
  const actualPort = resolved.port;

  return new Promise((resolve) => {
    const startTime = Date.now();
    const socket = new net.Socket();
    let responseData = Buffer.alloc(0);
    let resolved_ = false;

    const cleanup = () => {
      if (!resolved_) {
        resolved_ = true;
        socket.destroy();
      }
    };

    socket.setTimeout(timeout);

    socket.on("timeout", () => {
      cleanup();
      resolve({
        online: false,
        host,
        port,
        error: "Connection timeout",
      });
    });

    socket.on("error", (err) => {
      cleanup();
      resolve({
        online: false,
        host,
        port,
        error: err.message,
      });
    });

    socket.on("connect", () => {
      // Handshake 패킷 생성
      const hostBuffer = Buffer.from(actualHost, "utf8");
      const hostLengthVarInt = writeVarInt(hostBuffer.length);

      const handshakeData = Buffer.concat([
        writeVarInt(0x00), // Packet ID (Handshake)
        writeVarInt(767), // Protocol version (1.21.1)
        hostLengthVarInt,
        hostBuffer,
        Buffer.from([actualPort >> 8, actualPort & 0xff]), // Port (Big Endian)
        writeVarInt(1), // Next state (1 = Status)
      ]);

      const handshakePacket = Buffer.concat([
        writeVarInt(handshakeData.length),
        handshakeData,
      ]);

      // Status Request 패킷
      const statusRequest = Buffer.concat([
        writeVarInt(1), // Packet length
        writeVarInt(0x00), // Packet ID (Status Request)
      ]);

      socket.write(Buffer.concat([handshakePacket, statusRequest]));
    });

    socket.on("data", (data) => {
      responseData = Buffer.concat([responseData, data]);

      try {
        // 패킷 길이 읽기
        const { value: packetLength, size: lengthSize } = readVarInt(responseData, 0);

        if (responseData.length < lengthSize + packetLength) {
          return; // 더 많은 데이터 필요
        }

        // Packet ID 읽기
        const { value: packetId, size: idSize } = readVarInt(
          responseData,
          lengthSize
        );

        if (packetId !== 0x00) {
          cleanup();
          resolve({
            online: false,
            host,
            port,
            error: "Invalid packet ID",
          });
          return;
        }

        // JSON 길이 읽기
        const { value: jsonLength, size: jsonLengthSize } = readVarInt(
          responseData,
          lengthSize + idSize
        );

        // JSON 데이터 읽기
        const jsonStart = lengthSize + idSize + jsonLengthSize;
        const jsonData = responseData.slice(jsonStart, jsonStart + jsonLength).toString("utf8");
        const status = JSON.parse(jsonData);

        const pingTime = Date.now() - startTime;

        cleanup();

        // description 파싱 (문자열 또는 객체일 수 있음)
        let description = "";
        if (typeof status.description === "string") {
          description = status.description;
        } else if (status.description?.text) {
          description = status.description.text;
        } else if (status.description?.extra) {
          description = status.description.extra
            .map((e: any) => e.text || "")
            .join("");
        }

        resolve({
          online: true,
          host,
          port,
          version: status.version,
          players: status.players,
          description,
          favicon: status.favicon,
          ping: pingTime,
        });
      } catch (e) {
        // 아직 전체 패킷을 받지 못함
      }
    });

    socket.connect(actualPort, actualHost);
  });
}

// IPC 핸들러
ipcMain.handle("server:ping", async (_, host?: string, port?: number) => {
  try {
    const status = await pingMinecraftServer(
      host || DEFAULT_SERVER.host,
      port || DEFAULT_SERVER.port
    );
    return status;
  } catch (error) {
    return {
      online: false,
      host: host || DEFAULT_SERVER.host,
      port: port || DEFAULT_SERVER.port,
      error: (error as Error).message,
    };
  }
});

// 기본 서버 정보 가져오기
ipcMain.handle("server:getDefault", () => {
  return DEFAULT_SERVER;
});

// =====================
// 모드 관리
// =====================

interface ModInfo {
  filename: string;
  name: string;
  enabled: boolean;
  size: string;
}

// 모드 폴더 스캔
ipcMain.handle("mods:scan", async (_, gameDir: string): Promise<{ success: boolean; mods?: ModInfo[]; error?: string }> => {
  try {
    const modsPath = path.join(gameDir, "mods");

    // mods 폴더 존재 확인
    if (!fs.existsSync(modsPath)) {
      return { success: true, mods: [] };
    }

    const files = fs.readdirSync(modsPath);
    const mods: ModInfo[] = [];

    for (const file of files) {
      // .jar 또는 .jar.disabled 파일만 처리
      if (file.endsWith(".jar") || file.endsWith(".jar.disabled")) {
        const filePath = path.join(modsPath, file);
        const stats = fs.statSync(filePath);
        const enabled = file.endsWith(".jar");

        // 파일 이름에서 모드 이름 추출 (버전 번호 제거 시도)
        let name = file.replace(/\.jar(\.disabled)?$/, "");
        // 일반적인 모드 파일명 패턴: modname-1.20.1-1.0.0.jar
        const nameMatch = name.match(/^(.+?)[-_](?:\d|mc|forge|fabric)/i);
        if (nameMatch) {
          name = nameMatch[1];
        }

        // 파일 크기 포맷
        const sizeInMB = stats.size / (1024 * 1024);
        const size = sizeInMB >= 1
          ? `${sizeInMB.toFixed(1)} MB`
          : `${(stats.size / 1024).toFixed(0)} KB`;

        mods.push({
          filename: file,
          name,
          enabled,
          size,
        });
      }
    }

    // 이름 순 정렬
    mods.sort((a, b) => a.name.localeCompare(b.name));

    return { success: true, mods };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// 모드 활성화/비활성화 토글
ipcMain.handle("mods:toggle", async (_, gameDir: string, filename: string): Promise<{ success: boolean; newFilename?: string; error?: string }> => {
  try {
    const modsPath = path.join(gameDir, "mods");
    const currentPath = path.join(modsPath, filename);

    if (!fs.existsSync(currentPath)) {
      return { success: false, error: "파일을 찾을 수 없습니다." };
    }

    let newFilename: string;
    if (filename.endsWith(".jar.disabled")) {
      // 활성화: .jar.disabled -> .jar
      newFilename = filename.replace(/\.disabled$/, "");
    } else if (filename.endsWith(".jar")) {
      // 비활성화: .jar -> .jar.disabled
      newFilename = filename + ".disabled";
    } else {
      return { success: false, error: "잘못된 파일 형식입니다." };
    }

    const newPath = path.join(modsPath, newFilename);
    fs.renameSync(currentPath, newPath);

    return { success: true, newFilename };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// =====================
// 셰이더 관리
// =====================

interface ShaderInfo {
  filename: string;
  name: string;
  enabled: boolean;
  size: string;
}

// 셰이더 폴더 스캔
ipcMain.handle("shaders:scan", async (_, gameDir: string): Promise<{ success: boolean; shaders?: ShaderInfo[]; error?: string }> => {
  try {
    const shadersPath = path.join(gameDir, "shaderpacks");

    // shaderpacks 폴더 존재 확인
    if (!fs.existsSync(shadersPath)) {
      return { success: true, shaders: [] };
    }

    const files = fs.readdirSync(shadersPath);
    const shaders: ShaderInfo[] = [];

    for (const file of files) {
      // .zip 또는 .zip.disabled 파일만 처리
      if (file.endsWith(".zip") || file.endsWith(".zip.disabled")) {
        const filePath = path.join(shadersPath, file);
        const stats = fs.statSync(filePath);
        const enabled = file.endsWith(".zip");

        // 파일 이름에서 셰이더 이름 추출 (버전 번호 제거 시도)
        let name = file.replace(/\.zip(\.disabled)?$/, "");
        // 일반적인 셰이더 파일명 패턴: ShaderName-v1.0.zip
        const nameMatch = name.match(/^(.+?)[-_](?:v?\d|mc)/i);
        if (nameMatch) {
          name = nameMatch[1];
        }

        // 파일 크기 포맷
        const sizeInMB = stats.size / (1024 * 1024);
        const size = sizeInMB >= 1
          ? `${sizeInMB.toFixed(1)} MB`
          : `${(stats.size / 1024).toFixed(0)} KB`;

        shaders.push({
          filename: file,
          name,
          enabled,
          size,
        });
      }
    }

    // 이름 순 정렬
    shaders.sort((a, b) => a.name.localeCompare(b.name));

    return { success: true, shaders };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// 셰이더 활성화/비활성화 토글
ipcMain.handle("shaders:toggle", async (_, gameDir: string, filename: string): Promise<{ success: boolean; newFilename?: string; error?: string }> => {
  try {
    const shadersPath = path.join(gameDir, "shaderpacks");
    const currentPath = path.join(shadersPath, filename);

    if (!fs.existsSync(currentPath)) {
      return { success: false, error: "파일을 찾을 수 없습니다." };
    }

    let newFilename: string;
    if (filename.endsWith(".zip.disabled")) {
      // 활성화: .zip.disabled -> .zip
      newFilename = filename.replace(/\.disabled$/, "");
    } else if (filename.endsWith(".zip")) {
      // 비활성화: .zip -> .zip.disabled
      newFilename = filename + ".disabled";
    } else {
      return { success: false, error: "잘못된 파일 형식입니다." };
    }

    const newPath = path.join(shadersPath, newFilename);
    fs.renameSync(currentPath, newPath);

    return { success: true, newFilename };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// =====================
// NeoForge 관리
// =====================

// NeoForge 버전 목록 가져오기
ipcMain.handle("neoforge:getVersions", async (_, mcVersion: string = "1.21.1") => {
  try {
    const versions = await getNeoForgeVersions(mcVersion);
    return { success: true, data: versions };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// 최신 NeoForge 버전 가져오기
ipcMain.handle("neoforge:getLatestVersion", async (_, mcVersion: string = "1.21.1") => {
  try {
    const version = await getLatestNeoForgeVersion(mcVersion);
    return { success: true, data: version };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// NeoForge 설치
ipcMain.handle(
  "neoforge:install",
  async (
    event,
    options: {
      neoforgeVersion: NeoForgeVersion;
      gameDir: string;
    }
  ) => {
    const { neoforgeVersion, gameDir } = options;

    try {
      // First, ensure vanilla Minecraft is installed
      const vanillaVersion = neoforgeVersion.mcVersion;
      const vanillaJsonPath = path.join(gameDir, "versions", vanillaVersion, `${vanillaVersion}.json`);

      if (!fs.existsSync(vanillaJsonPath)) {
        sendProgress("install:progress", {
          stage: "vanilla",
          message: `바닐라 ${vanillaVersion} 설치 중...`,
          progress: 0,
        });

        // Get vanilla version manifest
        if (!versionManifestCache) {
          versionManifestCache = await getVersionManifest();
        }

        const versionInfo = versionManifestCache.versions.find(v => v.id === vanillaVersion);
        if (!versionInfo) {
          throw new Error(`바닐라 버전 ${vanillaVersion}을 찾을 수 없습니다.`);
        }

        // Install vanilla version first
        const versionDetails = await getVersionDetails(versionInfo);
        const versionDir = path.join(gameDir, "versions", vanillaVersion);
        await fs.promises.mkdir(versionDir, { recursive: true });

        // Save vanilla version JSON
        await fs.promises.writeFile(
          path.join(versionDir, `${vanillaVersion}.json`),
          JSON.stringify(versionDetails, null, 2)
        );

        // Download client JAR
        const clientJarPath = path.join(versionDir, `${vanillaVersion}.jar`);
        if (!fs.existsSync(clientJarPath)) {
          await downloadFile(
            versionDetails.downloads.client.url,
            clientJarPath,
            (p) => {
              sendProgress("install:progress", {
                stage: "vanilla",
                message: `바닐라 클라이언트 다운로드 중... ${p.percentage}%`,
                progress: p.percentage * 0.15,
              });
            }
          );
        }

        // Download vanilla libraries
        const librariesDir = path.join(gameDir, "libraries");
        const totalLibraries = versionDetails.libraries.filter(l => shouldIncludeLibrary(l)).length;
        let downloadedLibraries = 0;

        for (const library of versionDetails.libraries) {
          if (!shouldIncludeLibrary(library)) continue;

          if (library.downloads?.artifact) {
            const libPath = path.join(librariesDir, library.downloads.artifact.path);
            if (!fs.existsSync(libPath)) {
              await downloadFile(library.downloads.artifact.url, libPath);
            }
          }

          // Native libraries
          if (library.natives && library.downloads?.classifiers) {
            const osKey = process.platform === "win32" ? "windows" : process.platform === "darwin" ? "osx" : "linux";
            const nativeClassifier = library.natives[osKey];

            if (nativeClassifier && library.downloads.classifiers[nativeClassifier]) {
              const nativeArtifact = library.downloads.classifiers[nativeClassifier];
              const nativePath = path.join(librariesDir, nativeArtifact.path);
              if (!fs.existsSync(nativePath)) {
                await downloadFile(nativeArtifact.url, nativePath);
              }
            }
          }

          downloadedLibraries++;
          sendProgress("install:progress", {
            stage: "vanilla",
            message: `바닐라 라이브러리 다운로드 중: ${downloadedLibraries}/${totalLibraries}`,
            progress: 15 + (downloadedLibraries / totalLibraries) * 15,
          });
        }

        // Download assets
        sendProgress("install:progress", {
          stage: "vanilla",
          message: "에셋 다운로드 중...",
          progress: 30,
        });

        const assetsDir = path.join(gameDir, "assets");
        const assetIndexDir = path.join(assetsDir, "indexes");
        await fs.promises.mkdir(assetIndexDir, { recursive: true });

        const assetIndexPath = path.join(assetIndexDir, `${versionDetails.assetIndex.id}.json`);
        if (!fs.existsSync(assetIndexPath)) {
          await downloadFile(versionDetails.assetIndex.url, assetIndexPath);
        }

        const assetIndex = JSON.parse(await fs.promises.readFile(assetIndexPath, "utf-8"));
        const assetObjects = Object.entries(assetIndex.objects) as [string, { hash: string; size: number }][];
        const objectsDir = path.join(assetsDir, "objects");

        let downloadedAssets = 0;
        for (const [, asset] of assetObjects) {
          const hash = asset.hash;
          const hashPrefix = hash.substring(0, 2);
          const assetPath = path.join(objectsDir, hashPrefix, hash);

          if (!fs.existsSync(assetPath)) {
            const assetUrl = `https://resources.download.minecraft.net/${hashPrefix}/${hash}`;
            await downloadFile(assetUrl, assetPath);
          }

          downloadedAssets++;
          if (downloadedAssets % 100 === 0 || downloadedAssets === assetObjects.length) {
            sendProgress("install:progress", {
              stage: "vanilla",
              message: `에셋 다운로드 중: ${downloadedAssets}/${assetObjects.length}`,
              progress: 30 + (downloadedAssets / assetObjects.length) * 20,
            });
          }
        }
      }

      // Now install NeoForge
      sendProgress("install:progress", {
        stage: "neoforge",
        message: "NeoForge 설치 시작...",
        progress: 50,
      });

      const result = await downloadNeoForgeVersion(neoforgeVersion, gameDir, (stage, message, progress) => {
        sendProgress("install:progress", {
          stage: "neoforge",
          message,
          progress: 50 + progress * 0.5,
        });
      });

      if (!result.success) {
        throw new Error(result.error || "NeoForge 설치 실패");
      }

      sendProgress("install:progress", {
        stage: "done",
        message: "NeoForge 설치 완료!",
        progress: 100,
      });

      return { success: true, versionId: result.versionId };
    } catch (error) {
      sendProgress("install:error", { error: (error as Error).message });
      return { success: false, error: (error as Error).message };
    }
  }
);

// NeoForge 게임 실행
ipcMain.handle(
  "neoforge:launch",
  async (
    event,
    options: {
      javaPath: string;
      gameDir: string;
      versionId: string;
      username: string;
      uuid: string;
      accessToken: string;
      memoryMin: number;
      memoryMax: number;
      resolution?: { width: number; height: number; fullscreen?: boolean };
    }
  ) => {
    const {
      javaPath,
      gameDir,
      versionId,
      username,
      uuid,
      accessToken,
      memoryMin,
      memoryMax,
      resolution,
    } = options;

    try {
      // Read NeoForge version JSON
      const neoforgeJsonPath = path.join(gameDir, "versions", versionId, `${versionId}.json`);
      if (!fs.existsSync(neoforgeJsonPath)) {
        return { success: false, error: `NeoForge 버전 ${versionId}이 설치되어 있지 않습니다.` };
      }

      const neoforgeDetails: VersionDetails = JSON.parse(
        await fs.promises.readFile(neoforgeJsonPath, "utf-8")
      );

      // Get vanilla version from inheritsFrom
      const vanillaVersion = (neoforgeDetails as any).inheritsFrom;
      if (!vanillaVersion) {
        return { success: false, error: "바닐라 버전 정보를 찾을 수 없습니다." };
      }

      // Read vanilla version JSON
      const vanillaJsonPath = path.join(gameDir, "versions", vanillaVersion, `${vanillaVersion}.json`);
      if (!fs.existsSync(vanillaJsonPath)) {
        return { success: false, error: `바닐라 버전 ${vanillaVersion}이 설치되어 있지 않습니다.` };
      }

      const vanillaDetails: VersionDetails = JSON.parse(
        await fs.promises.readFile(vanillaJsonPath, "utf-8")
      );

      // Merge version details
      const mergedDetails = mergeVersionDetails(neoforgeDetails, vanillaDetails);

      // Extract natives
      const nativesDir = path.join(gameDir, "versions", versionId, "natives");
      await fs.promises.mkdir(nativesDir, { recursive: true });

      const librariesDir = path.join(gameDir, "libraries");
      for (const library of vanillaDetails.libraries) {
        if (!shouldIncludeLibrary(library)) continue;
        if (!library.natives) continue;

        const osKey = process.platform === "win32" ? "windows" : process.platform === "darwin" ? "osx" : "linux";
        const nativeClassifier = library.natives[osKey];
        if (!nativeClassifier) continue;

        if (library.downloads?.classifiers?.[nativeClassifier]) {
          const nativeArtifact = library.downloads.classifiers[nativeClassifier];
          const nativeJarPath = path.join(librariesDir, nativeArtifact.path);

          if (fs.existsSync(nativeJarPath)) {
            await extractNatives(nativeJarPath, nativesDir, library.extract?.exclude || []);
          }
        }
      }

      // Build classpath
      const classpath = buildNeoForgeClasspath(neoforgeDetails, vanillaDetails, gameDir, versionId);

      if (classpath.length === 0) {
        return { success: false, error: "라이브러리를 찾을 수 없습니다. NeoForge를 다시 설치해주세요." };
      }

      // Build JVM args
      // NeoForge의 ${version_name}은 바닐라 버전을 참조해야 함 (ignoreList에서 1.21.1.jar를 무시하기 위해)
      const jvmArgs = buildJvmArgs(
        mergedDetails,
        gameDir,
        vanillaVersion,  // NeoForge: 바닐라 버전 사용 (versionId 대신)
        nativesDir,
        classpath,
        memoryMin,
        memoryMax
      );

      // Build game args
      const assetsDir = path.join(gameDir, "assets");
      const gameArgs = buildGameArgs(
        mergedDetails,
        gameDir,
        versionId,
        assetsDir,
        username,
        uuid,
        accessToken,
        resolution
      );

      // Main class
      const mainClass = mergedDetails.mainClass;

      // Full args
      const allArgs = [...jvmArgs, mainClass, ...gameArgs];

      // Debug: Log JVM args
      console.log("=== NeoForge Launch Debug ===");
      console.log("Game Dir:", gameDir);
      console.log("Libraries Dir:", librariesDir);
      console.log("JVM Args:", JSON.stringify(jvmArgs, null, 2));

      // Check if securejarhandler exists
      const securejarPath = path.join(librariesDir, "cpw", "mods", "securejarhandler");
      console.log("Securejarhandler path:", securejarPath);
      console.log("Securejarhandler exists:", fs.existsSync(securejarPath));
      if (fs.existsSync(securejarPath)) {
        try {
          const files = fs.readdirSync(securejarPath);
          console.log("Securejarhandler contents:", files);
        } catch (e) {
          console.log("Error reading securejarhandler:", e);
        }
      }

      // Send debug info to renderer
      mainWindow?.webContents.send("game:log", {
        type: "debug",
        data: `Libraries Dir: ${librariesDir}`
      });
      mainWindow?.webContents.send("game:log", {
        type: "debug",
        data: `Securejarhandler exists: ${fs.existsSync(securejarPath)}`
      });

      console.log("Launching NeoForge with args:", javaPath, allArgs.join(" "));

      // Start game process
      gameProcess = spawn(javaPath, allArgs, {
        cwd: gameDir,
        detached: false,
        stdio: ["ignore", "pipe", "pipe"],
      });

      gameProcess.stdout?.on("data", (data) => {
        const lines = data.toString().split("\n");
        for (const line of lines) {
          if (line.trim()) {
            mainWindow?.webContents.send("game:log", { type: "stdout", data: line });
          }
        }
      });

      gameProcess.stderr?.on("data", (data) => {
        const lines = data.toString().split("\n");
        for (const line of lines) {
          if (line.trim()) {
            mainWindow?.webContents.send("game:log", { type: "stderr", data: line });
          }
        }
      });

      gameProcess.on("close", (code) => {
        mainWindow?.webContents.send("game:exit", { code });
        gameProcess = null;
      });

      gameProcess.on("error", (error) => {
        mainWindow?.webContents.send("game:error", { error: error.message });
        gameProcess = null;
      });

      return { success: true, pid: gameProcess.pid };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
);

// 설치된 NeoForge 버전 목록
ipcMain.handle("neoforge:getInstalledVersions", async (_, gameDir: string) => {
  try {
    const versionsDir = path.join(gameDir, "versions");
    if (!fs.existsSync(versionsDir)) {
      return { success: true, data: [] };
    }

    const entries = await fs.promises.readdir(versionsDir, { withFileTypes: true });
    const installed: string[] = [];

    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith("neoforge-")) {
        const versionJson = path.join(versionsDir, entry.name, `${entry.name}.json`);
        if (fs.existsSync(versionJson)) {
          installed.push(entry.name);
        }
      }
    }

    return { success: true, data: installed };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// NeoForge 버전 삭제
ipcMain.handle(
  "neoforge:deleteVersion",
  async (_, options: { versionId: string; gameDir: string }) => {
    const { versionId, gameDir } = options;
    const versionDir = path.join(gameDir, "versions", versionId);

    try {
      if (fs.existsSync(versionDir)) {
        await fs.promises.rm(versionDir, { recursive: true, force: true });
        return { success: true };
      } else {
        return { success: false, error: "버전 폴더가 존재하지 않습니다." };
      }
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
);
