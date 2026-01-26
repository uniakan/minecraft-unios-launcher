import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import AdmZip from "adm-zip";
import { downloadFile, VersionDetails, Library, shouldIncludeLibrary } from "./minecraft-core";

// NeoForge Maven API
const NEOFORGE_VERSIONS_API = "https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge";
const NEOFORGE_MAVEN_BASE = "https://maven.neoforged.net/releases";

export interface NeoForgeVersion {
  version: string;
  mcVersion: string;
  fullVersion: string; // e.g., "1.21.1-21.1.77"
}

export interface NeoForgeVersionManifest {
  versions: string[];
}

export interface NeoForgeInstallProfile {
  version: string;
  json: string;
  path: string | null;
  logo: string;
  minecraft: string;
  welcome: string;
  data: Record<string, { client: string; server: string }>;
  processors: NeoForgeProcessor[];
  libraries: NeoForgeLibrary[];
}

export interface NeoForgeProcessor {
  jar: string;
  classpath: string[];
  args: string[];
  sides?: string[];
  outputs?: Record<string, string>;
}

export interface NeoForgeLibrary {
  name: string;
  downloads?: {
    artifact?: {
      path: string;
      url: string;
      sha1: string;
      size: number;
    };
  };
}

// HTTP GET helper
function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        httpsGet(res.headers.location!).then(resolve).catch(reject);
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
    }).on("error", reject);
  });
}

// Get available NeoForge versions for a specific Minecraft version
export async function getNeoForgeVersions(mcVersion: string = "1.21.1"): Promise<NeoForgeVersion[]> {
  try {
    const data = await httpsGet(NEOFORGE_VERSIONS_API);
    const manifest: NeoForgeVersionManifest = JSON.parse(data);

    // Filter versions for the specified Minecraft version
    // NeoForge versions format: "21.1.77" for MC 1.21.1, "21.0.x" for MC 1.21
    const mcMajorMinor = mcVersion.split('.').slice(1).join('.');

    const neoforgeVersions: NeoForgeVersion[] = manifest.versions
      .filter(v => {
        // Match versions that correspond to the MC version
        // e.g., for MC 1.21.1, look for versions starting with "21.1"
        const versionParts = v.split('.');
        if (versionParts.length >= 2) {
          const majorMinor = `${versionParts[0]}.${versionParts[1]}`;
          return majorMinor === mcMajorMinor;
        }
        return false;
      })
      .map(v => ({
        version: v,
        mcVersion: mcVersion,
        fullVersion: `${mcVersion}-${v}`,
      }))
      .reverse(); // Latest first

    return neoforgeVersions;
  } catch (error) {
    console.error("Failed to fetch NeoForge versions:", error);
    return [];
  }
}

// Get the latest NeoForge version for a Minecraft version
export async function getLatestNeoForgeVersion(mcVersion: string = "1.21.1"): Promise<NeoForgeVersion | null> {
  const versions = await getNeoForgeVersions(mcVersion);
  return versions.length > 0 ? versions[0] : null;
}

// Library name to Maven path
export function libraryNameToMavenPath(name: string): string {
  const parts = name.split(":");
  const group = parts[0].replace(/\./g, "/");
  const artifact = parts[1];
  const version = parts[2];
  const classifier = parts.length > 3 ? parts[3] : null;
  const extension = parts.length > 4 ? parts[4] : "jar";

  if (classifier) {
    return `${group}/${artifact}/${version}/${artifact}-${version}-${classifier}.${extension}`;
  }
  return `${group}/${artifact}/${version}/${artifact}-${version}.${extension}`;
}

// Get Maven URL for a library
export function getLibraryUrl(name: string, baseUrl: string = NEOFORGE_MAVEN_BASE): string {
  const path = libraryNameToMavenPath(name);
  return `${baseUrl}/${path}`;
}

// Download NeoForge installer and extract version JSON
export async function downloadNeoForgeVersion(
  neoforgeVersion: NeoForgeVersion,
  gameDir: string,
  onProgress?: (stage: string, message: string, progress: number) => void
): Promise<{ success: boolean; versionId: string; error?: string }> {
  const { version, mcVersion, fullVersion } = neoforgeVersion;
  const versionId = `neoforge-${fullVersion}`;

  try {
    // Create directories
    const versionsDir = path.join(gameDir, "versions", versionId);
    const librariesDir = path.join(gameDir, "libraries");
    await fs.promises.mkdir(versionsDir, { recursive: true });
    await fs.promises.mkdir(librariesDir, { recursive: true });

    onProgress?.("download", "NeoForge 버전 정보 다운로드 중...", 5);

    // Download NeoForge installer JAR
    const installerUrl = `${NEOFORGE_MAVEN_BASE}/net/neoforged/neoforge/${version}/neoforge-${version}-installer.jar`;
    const installerPath = path.join(versionsDir, `neoforge-${version}-installer.jar`);

    onProgress?.("download", "NeoForge 설치 파일 다운로드 중...", 10);
    await downloadFile(installerUrl, installerPath, (p) => {
      onProgress?.("download", `설치 파일 다운로드 중... ${p.percentage}%`, 10 + p.percentage * 0.2);
    });

    // Extract version.json and install_profile.json from installer JAR
    const zip = new AdmZip(installerPath);

    // Read version.json
    const versionJsonEntry = zip.getEntry("version.json");
    if (!versionJsonEntry) {
      throw new Error("version.json not found in installer");
    }
    const versionJson: VersionDetails = JSON.parse(versionJsonEntry.getData().toString("utf8"));

    // Read install_profile.json
    const installProfileEntry = zip.getEntry("install_profile.json");
    if (!installProfileEntry) {
      throw new Error("install_profile.json not found in installer");
    }
    const installProfile: NeoForgeInstallProfile = JSON.parse(installProfileEntry.getData().toString("utf8"));

    onProgress?.("process", "버전 설정 처리 중...", 35);

    // Modify version JSON
    // Set the ID and inheritsFrom
    versionJson.id = versionId;
    if (!versionJson.inheritsFrom) {
      (versionJson as any).inheritsFrom = mcVersion;
    }

    // Save version JSON
    const versionJsonPath = path.join(versionsDir, `${versionId}.json`);
    await fs.promises.writeFile(versionJsonPath, JSON.stringify(versionJson, null, 2));

    onProgress?.("libraries", "라이브러리 다운로드 중...", 40);

    // Download NeoForge libraries
    const allLibraries = [...(versionJson.libraries || []), ...(installProfile.libraries || [])];
    const totalLibraries = allLibraries.length;
    let downloadedLibraries = 0;

    for (const library of allLibraries) {
      const libName = library.name;
      const libPath = libraryNameToMavenPath(libName);
      const localPath = path.join(librariesDir, libPath);

      if (!fs.existsSync(localPath)) {
        // Try to get URL from library downloads or construct from name
        let url = (library as any).downloads?.artifact?.url;

        if (!url) {
          // Try NeoForge Maven first, then Mojang Maven
          const neoforgeUrl = `${NEOFORGE_MAVEN_BASE}/${libPath}`;
          const mojangUrl = `https://libraries.minecraft.net/${libPath}`;

          // Check if it's a NeoForge/Forge library
          if (libName.startsWith("net.neoforged") ||
              libName.startsWith("net.minecraftforge") ||
              libName.startsWith("cpw.mods") ||
              libName.startsWith("org.ow2.asm") ||
              libName.startsWith("net.sf.jopt-simple") ||
              libName.startsWith("de.oceanlabs")) {
            url = neoforgeUrl;
          } else {
            url = mojangUrl;
          }
        }

        try {
          await downloadFile(url, localPath);
        } catch (err) {
          // Try alternate URLs
          const altUrls = [
            `${NEOFORGE_MAVEN_BASE}/${libPath}`,
            `https://libraries.minecraft.net/${libPath}`,
            `https://maven.minecraftforge.net/${libPath}`,
          ];

          let downloaded = false;
          for (const altUrl of altUrls) {
            if (altUrl === url) continue;
            try {
              await downloadFile(altUrl, localPath);
              downloaded = true;
              break;
            } catch (e) {
              // Continue to next URL
            }
          }

          if (!downloaded) {
            console.warn(`Failed to download library: ${libName}`);
          }
        }
      }

      downloadedLibraries++;
      const progress = 40 + (downloadedLibraries / totalLibraries) * 40;
      onProgress?.("libraries", `라이브러리 다운로드 중: ${downloadedLibraries}/${totalLibraries}`, progress);
    }

    // Extract client data from installer (maven/ folder)
    onProgress?.("extract", "클라이언트 데이터 추출 중...", 85);

    const entries = zip.getEntries();
    let extractedCount = 0;
    const mavenEntries = entries.filter(e => e.entryName.startsWith("maven/") && !e.isDirectory);
    console.log(`Found ${mavenEntries.length} files in maven/ folder to extract`);

    for (const entry of mavenEntries) {
      const relativePath = entry.entryName.substring(6); // Remove "maven/" prefix
      const destPath = path.join(librariesDir, relativePath);
      const destDir = path.dirname(destPath);

      try {
        // 항상 추출 (기존 파일이 손상되었을 수 있음)
        await fs.promises.mkdir(destDir, { recursive: true });
        const data = entry.getData();
        await fs.promises.writeFile(destPath, data);
        extractedCount++;

        // Log securejarhandler specifically
        if (relativePath.includes("securejarhandler")) {
          console.log(`Extracted securejarhandler: ${destPath}`);
          console.log(`File size: ${data.length} bytes`);
        }
      } catch (extractError) {
        console.error(`Failed to extract ${relativePath}:`, extractError);
      }
    }

    console.log(`Successfully extracted ${extractedCount}/${mavenEntries.length} files`);

    // Clean up installer
    try {
      await fs.promises.unlink(installerPath);
    } catch (e) {
      // Ignore cleanup errors
    }

    onProgress?.("done", "NeoForge 설치 완료!", 100);

    return { success: true, versionId };
  } catch (error) {
    return {
      success: false,
      versionId,
      error: (error as Error).message
    };
  }
}

// Build classpath for NeoForge
export function buildNeoForgeClasspath(
  versionDetails: VersionDetails,
  vanillaDetails: VersionDetails,
  gameDir: string,
  versionId: string
): string[] {
  const classpath: string[] = [];
  const librariesDir = path.join(gameDir, "libraries");
  const versionsDir = path.join(gameDir, "versions");

  // Add NeoForge libraries first
  for (const library of versionDetails.libraries || []) {
    if (!shouldIncludeLibrary(library)) continue;

    if ((library as any).downloads?.artifact?.path) {
      const libPath = path.join(librariesDir, (library as any).downloads.artifact.path);
      if (fs.existsSync(libPath) && !classpath.includes(libPath)) {
        classpath.push(libPath);
      }
    } else {
      const libPath = path.join(librariesDir, libraryNameToMavenPath(library.name));
      if (fs.existsSync(libPath) && !classpath.includes(libPath)) {
        classpath.push(libPath);
      }
    }
  }

  // Add vanilla libraries
  for (const library of vanillaDetails.libraries || []) {
    if (!shouldIncludeLibrary(library)) continue;

    if (library.downloads?.artifact) {
      const libPath = path.join(librariesDir, library.downloads.artifact.path);
      if (fs.existsSync(libPath) && !classpath.includes(libPath)) {
        classpath.push(libPath);
      }
    }
  }

  // Add vanilla client jar
  const vanillaVersion = (versionDetails as any).inheritsFrom || versionDetails.id.split("-")[0];
  const clientJar = path.join(versionsDir, vanillaVersion, `${vanillaVersion}.jar`);
  if (fs.existsSync(clientJar) && !classpath.includes(clientJar)) {
    classpath.push(clientJar);
  }

  return classpath;
}

// Merge version details (NeoForge + vanilla)
export function mergeVersionDetails(
  neoforgeDetails: VersionDetails,
  vanillaDetails: VersionDetails
): VersionDetails {
  const merged: VersionDetails = { ...vanillaDetails };

  // Use NeoForge main class
  merged.mainClass = neoforgeDetails.mainClass;

  // Merge arguments
  if (neoforgeDetails.arguments) {
    merged.arguments = merged.arguments || { game: [], jvm: [] };

    if (neoforgeDetails.arguments.jvm) {
      merged.arguments.jvm = [
        ...(merged.arguments.jvm || []),
        ...neoforgeDetails.arguments.jvm,
      ];
    }

    if (neoforgeDetails.arguments.game) {
      merged.arguments.game = [
        ...(merged.arguments.game || []),
        ...neoforgeDetails.arguments.game,
      ];
    }
  }

  // Merge libraries (NeoForge first, then vanilla)
  merged.libraries = [
    ...(neoforgeDetails.libraries || []),
    ...(vanillaDetails.libraries || []),
  ];

  return merged;
}
