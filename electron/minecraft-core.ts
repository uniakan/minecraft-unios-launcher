import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";
import { createWriteStream } from "fs";

// Mojang API URLs
const VERSION_MANIFEST_URL =
  "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";

export interface VersionManifest {
  latest: {
    release: string;
    snapshot: string;
  };
  versions: VersionInfo[];
}

export interface VersionInfo {
  id: string;
  type: "release" | "snapshot" | "old_beta" | "old_alpha";
  url: string;
  time: string;
  releaseTime: string;
  sha1: string;
  complianceLevel: number;
}

export interface VersionDetails {
  id: string;
  type: string;
  mainClass: string;
  minecraftArguments?: string;
  arguments?: {
    game: (string | ArgumentRule)[];
    jvm: (string | ArgumentRule)[];
  };
  libraries: Library[];
  downloads: {
    client: {
      sha1: string;
      size: number;
      url: string;
    };
    client_mappings?: {
      sha1: string;
      size: number;
      url: string;
    };
    server?: {
      sha1: string;
      size: number;
      url: string;
    };
  };
  assetIndex: {
    id: string;
    sha1: string;
    size: number;
    totalSize: number;
    url: string;
  };
  assets: string;
  javaVersion?: {
    component: string;
    majorVersion: number;
  };
  logging?: {
    client: {
      argument: string;
      file: {
        id: string;
        sha1: string;
        size: number;
        url: string;
      };
      type: string;
    };
  };
}

export interface ArgumentRule {
  rules?: {
    action: "allow" | "disallow";
    features?: Record<string, boolean>;
    os?: {
      name?: string;
      arch?: string;
      version?: string;
    };
  }[];
  value: string | string[];
}

export interface Library {
  name: string;
  downloads?: {
    artifact?: {
      path: string;
      sha1: string;
      size: number;
      url: string;
    };
    classifiers?: Record<
      string,
      {
        path: string;
        sha1: string;
        size: number;
        url: string;
      }
    >;
  };
  natives?: Record<string, string>;
  rules?: {
    action: "allow" | "disallow";
    os?: {
      name?: string;
      arch?: string;
    };
  }[];
  extract?: {
    exclude?: string[];
  };
}

export interface AssetIndex {
  objects: Record<
    string,
    {
      hash: string;
      size: number;
    }
  >;
}

export interface DownloadProgress {
  filename: string;
  current: number;
  total: number;
  percentage: number;
}

// HTTP GET request helper
function httpGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    protocol
      .get(url, (res) => {
        // Handle redirects
        if (res.statusCode === 301 || res.statusCode === 302) {
          httpGet(res.headers.location!).then(resolve).catch(reject);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }

        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

// Download file with progress
export function downloadFile(
  url: string,
  destPath: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Ensure directory exists
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const protocol = url.startsWith("https") ? https : http;
    protocol
      .get(url, (res) => {
        // Handle redirects
        if (res.statusCode === 301 || res.statusCode === 302) {
          downloadFile(res.headers.location!, destPath, onProgress)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }

        const totalSize = parseInt(res.headers["content-length"] || "0", 10);
        let downloadedSize = 0;

        const file = createWriteStream(destPath);

        res.on("data", (chunk) => {
          downloadedSize += chunk.length;
          if (onProgress && totalSize > 0) {
            onProgress({
              filename: path.basename(destPath),
              current: downloadedSize,
              total: totalSize,
              percentage: Math.round((downloadedSize / totalSize) * 100),
            });
          }
        });

        res.pipe(file);

        file.on("finish", () => {
          file.close();
          resolve();
        });

        file.on("error", (err) => {
          fs.unlink(destPath, () => {}); // Delete failed file
          reject(err);
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

// Get version manifest from Mojang
export async function getVersionManifest(): Promise<VersionManifest> {
  const data = await httpGet(VERSION_MANIFEST_URL);
  return JSON.parse(data);
}

// Get version details
export async function getVersionDetails(
  versionInfo: VersionInfo
): Promise<VersionDetails> {
  const data = await httpGet(versionInfo.url);
  return JSON.parse(data);
}

// Get asset index
export async function getAssetIndex(
  assetIndexUrl: string
): Promise<AssetIndex> {
  const data = await httpGet(assetIndexUrl);
  return JSON.parse(data);
}

// Check if library should be included for current OS
export function shouldIncludeLibrary(library: Library): boolean {
  if (!library.rules) return true;

  let dominated = false;
  let dominated_value = false;

  for (const rule of library.rules) {
    if (rule.os) {
      const osName =
        process.platform === "win32"
          ? "windows"
          : process.platform === "darwin"
          ? "osx"
          : "linux";

      if (rule.os.name && rule.os.name !== osName) continue;

      if (rule.os.arch) {
        const arch = process.arch === "x64" ? "x64" : "x86";
        if (rule.os.arch !== arch) continue;
      }
    }

    dominated = true;
    dominated_value = rule.action === "allow";
  }

  return dominated ? dominated_value : true;
}

// Get native classifier for current OS
export function getNativeClassifier(): string {
  const osName =
    process.platform === "win32"
      ? "windows"
      : process.platform === "darwin"
      ? "osx"
      : "linux";

  const arch = process.arch === "x64" ? "64" : "32";

  if (osName === "windows") {
    return `natives-windows`;
  } else if (osName === "osx") {
    return "natives-osx";
  } else {
    return "natives-linux";
  }
}

// Parse library name to path
export function libraryNameToPath(name: string): string {
  const parts = name.split(":");
  const group = parts[0].replace(/\./g, "/");
  const artifact = parts[1];
  const version = parts[2];
  const classifier = parts[3] || "";

  if (classifier) {
    return `${group}/${artifact}/${version}/${artifact}-${version}-${classifier}.jar`;
  }
  return `${group}/${artifact}/${version}/${artifact}-${version}.jar`;
}

// Build classpath for game launch
export function buildClasspath(
  versionDetails: VersionDetails,
  gameDir: string,
  versionId: string
): string[] {
  const classpath: string[] = [];
  const librariesDir = path.join(gameDir, "libraries");
  const versionsDir = path.join(gameDir, "versions", versionId);

  // Add libraries
  for (const library of versionDetails.libraries) {
    if (!shouldIncludeLibrary(library)) continue;

    if (library.downloads?.artifact) {
      const libPath = path.join(librariesDir, library.downloads.artifact.path);
      if (fs.existsSync(libPath)) {
        classpath.push(libPath);
      }
    } else {
      // Fallback for libraries without downloads section
      const libPath = path.join(librariesDir, libraryNameToPath(library.name));
      if (fs.existsSync(libPath)) {
        classpath.push(libPath);
      }
    }
  }

  // Add client jar
  const clientJar = path.join(versionsDir, `${versionId}.jar`);
  if (fs.existsSync(clientJar)) {
    classpath.push(clientJar);
  }

  return classpath;
}

// Build JVM arguments
export function buildJvmArgs(
  versionDetails: VersionDetails,
  gameDir: string,
  versionId: string,
  nativesDir: string,
  classpath: string[],
  memoryMin: number,
  memoryMax: number
): string[] {
  const args: string[] = [];

  // Memory settings
  args.push(`-Xms${memoryMin}M`);
  args.push(`-Xmx${memoryMax}M`);

  // Common JVM args
  args.push(`-Djava.library.path=${nativesDir}`);
  args.push("-Dminecraft.launcher.brand=UniOS");
  args.push("-Dminecraft.launcher.version=1.0.5");

  // Process JVM arguments from version JSON (1.13+)
  if (versionDetails.arguments?.jvm) {
    for (const arg of versionDetails.arguments.jvm) {
      if (typeof arg === "string") {
        args.push(
          substituteArg(arg, gameDir, versionId, nativesDir, classpath)
        );
      } else {
        // Handle ArgumentRule
        if (shouldApplyArgumentRule(arg)) {
          const values = Array.isArray(arg.value) ? arg.value : [arg.value];
          for (const v of values) {
            args.push(
              substituteArg(v, gameDir, versionId, nativesDir, classpath)
            );
          }
        }
      }
    }
  } else {
    // Legacy JVM args
    args.push("-cp");
    args.push(classpath.join(process.platform === "win32" ? ";" : ":"));
  }

  return args;
}

// Build game arguments
export function buildGameArgs(
  versionDetails: VersionDetails,
  gameDir: string,
  versionId: string,
  assetsDir: string,
  username: string,
  uuid: string,
  accessToken: string,
  resolution?: { width: number; height: number; fullscreen?: boolean }
): string[] {
  const args: string[] = [];

  // Legacy minecraftArguments (pre-1.13)
  if (versionDetails.minecraftArguments) {
    const template = versionDetails.minecraftArguments;
    const substituted = template
      .replace("${auth_player_name}", username)
      .replace("${version_name}", versionId)
      .replace("${game_directory}", gameDir)
      .replace("${assets_root}", assetsDir)
      .replace("${assets_index_name}", versionDetails.assetIndex.id)
      .replace("${auth_uuid}", uuid)
      .replace("${auth_access_token}", accessToken)
      .replace("${user_type}", "msa")
      .replace("${version_type}", versionDetails.type)
      .replace("${user_properties}", "{}");

    args.push(...substituted.split(" "));
  }

  // Modern arguments (1.13+)
  if (versionDetails.arguments?.game) {
    for (const arg of versionDetails.arguments.game) {
      if (typeof arg === "string") {
        args.push(
          substituteGameArg(
            arg,
            versionDetails,
            gameDir,
            assetsDir,
            username,
            uuid,
            accessToken
          )
        );
      } else {
        if (shouldApplyArgumentRule(arg)) {
          const values = Array.isArray(arg.value) ? arg.value : [arg.value];
          for (const v of values) {
            args.push(
              substituteGameArg(
                v,
                versionDetails,
                gameDir,
                assetsDir,
                username,
                uuid,
                accessToken
              )
            );
          }
        }
      }
    }
  }

  // Resolution
  if (resolution) {
    if (resolution.fullscreen) {
      args.push("--fullscreen");
    } else {
      args.push("--width", String(resolution.width));
      args.push("--height", String(resolution.height));
    }
  }

  return args;
}

function substituteArg(
  arg: string,
  gameDir: string,
  versionId: string,
  nativesDir: string,
  classpath: string[]
): string {
  let result = arg
    .replace("${natives_directory}", nativesDir)
    .replace("${launcher_name}", "UniOS")
    .replace("${launcher_version}", "1.0.5")
    .replace(
      "${classpath}",
      classpath.join(process.platform === "win32" ? ";" : ":")
    )
    .replace(/\$\{library_directory\}/g, path.join(gameDir, "libraries"))
    .replace(/\$\{classpath_separator\}/g, process.platform === "win32" ? ";" : ":")
    .replace("${version_name}", versionId);

  // Windows에서 경로의 forward slash를 backslash로 변환
  if (process.platform === "win32") {
    // JVM 모듈 인자는 forward slash를 유지해야 함 (예: java.base/sun.security.util)
    // 패턴: module/package 형태이고 파일 경로가 아닌 경우
    const isJvmModuleArg = /^[a-zA-Z0-9._]+\/[a-zA-Z0-9._]+=/.test(result) || // module/package=
                          /^[a-zA-Z0-9._]+\/[a-zA-Z0-9._]+$/.test(result);    // module/package

    if (!isJvmModuleArg) {
      // classpath_separator(;)로 분리된 경로들을 각각 정규화
      if (result.includes(";") && (result.includes("/") || result.includes("\\"))) {
        result = result.split(";").map(p => p.replace(/\//g, "\\")).join(";");
      } else if (result.includes("/") && !result.startsWith("-")) {
        // 단일 경로인 경우 (옵션이 아닌 경우만)
        result = result.replace(/\//g, "\\");
      }
    }
  }

  return result;
}

function substituteGameArg(
  arg: string,
  versionDetails: VersionDetails,
  gameDir: string,
  assetsDir: string,
  username: string,
  uuid: string,
  accessToken: string
): string {
  return arg
    .replace("${auth_player_name}", username)
    .replace("${version_name}", versionDetails.id)
    .replace("${game_directory}", gameDir)
    .replace("${assets_root}", assetsDir)
    .replace("${assets_index_name}", versionDetails.assetIndex.id)
    .replace("${auth_uuid}", uuid)
    .replace("${auth_access_token}", accessToken)
    .replace("${user_type}", "msa")
    .replace("${version_type}", versionDetails.type)
    .replace("${user_properties}", "{}")
    .replace("${clientid}", "")
    .replace("${auth_xuid}", "");
}

function shouldApplyArgumentRule(arg: ArgumentRule): boolean {
  if (!arg.rules) return true;

  for (const rule of arg.rules) {
    // Check OS
    if (rule.os) {
      const osName =
        process.platform === "win32"
          ? "windows"
          : process.platform === "darwin"
          ? "osx"
          : "linux";

      if (rule.os.name && rule.os.name !== osName) {
        if (rule.action === "allow") return false;
        continue;
      }
    }

    // Check features (skip feature-based rules)
    if (rule.features) {
      // Skip demo, resolution, etc. features for now
      return false;
    }

    if (rule.action === "allow") return true;
    if (rule.action === "disallow") return false;
  }

  return true;
}
