import { useState, useEffect, useCallback } from "react";
import { Button } from "@shared/ui";
import { useTranslation } from "@shared/i18n";

export function ServerInfo() {
  const { t } = useTranslation();
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchServerStatus = useCallback(async () => {
    try {
      const status = await window.electronAPI?.server.ping();
      setServerStatus(status);
    } catch (error) {
      setServerStatus({
        online: false,
        host: "hardy-unios-server.uniakan.com",
        port: 25565,
        error: "Failed to fetch server status",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServerStatus();
    // 30초마다 서버 상태 갱신
    const interval = setInterval(fetchServerStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchServerStatus]);

  const getPingColor = (ping?: number) => {
    if (!ping) return "text-forest-400";
    if (ping < 50) return "text-green-600";
    if (ping < 100) return "text-yellow-600";
    return "text-red-600";
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col p-2">
        <div className="flex flex-col items-start gap-3 pb-2">
          <div className="space-y-0.5">
            <h3 className="text-2xl font-bold text-forest-900 drop-shadow-sm">
              {t("serverInfo.title")}
            </h3>
            <p className="text-sm text-forest-500 font-medium">
              {t("serverInfo.desc")}
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-bold border border-gray-200 shadow-sm flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse" />
            연결 중...
          </span>
        </div>
        <div className="mt-6 flex flex-col gap-3 flex-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3.5 bg-white/50 rounded-xl border border-forest-50 animate-pulse"
            >
              <span className="h-4 w-20 bg-forest-100 rounded" />
              <span className="h-4 w-16 bg-forest-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-2">
      <div className="flex flex-col items-start gap-3 pb-2">
        <div className="space-y-0.5">
          <h3 className="text-2xl font-bold text-forest-900 drop-shadow-sm">
            {t("serverInfo.title")}
          </h3>
          <p className="text-sm text-forest-500 font-medium">
            {t("serverInfo.desc")}
          </p>
        </div>
        {serverStatus?.online ? (
          <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold border border-green-200 shadow-sm flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {t("serverInfo.online")}
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200 shadow-sm flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Offline
          </span>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 flex-1">
        <div className="flex items-center justify-between p-3.5 bg-white/50 rounded-xl border border-forest-50 hover:bg-forest-50/50 transition-colors">
          <span className="text-sm text-forest-600 font-bold">
            {t("serverInfo.players")}
          </span>
          <span className="text-sm font-extrabold text-forest-800">
            {serverStatus?.online
              ? `${serverStatus.players?.online ?? 0} / ${serverStatus.players?.max ?? 0}`
              : "- / -"}
          </span>
        </div>

        <div className="flex items-center justify-between p-3.5 bg-white/50 rounded-xl border border-forest-50 hover:bg-forest-50/50 transition-colors">
          <span className="text-sm text-forest-600 font-bold">
            {t("serverInfo.version")}
          </span>
          <span className="text-sm font-extrabold text-forest-800">
            {serverStatus?.online ? serverStatus.version?.name ?? "-" : "-"}
          </span>
        </div>

        <div className="flex items-center justify-between p-3.5 bg-fairy-50/80 rounded-xl border border-fairy-200 hover:bg-fairy-100/50 transition-colors">
          <span className="text-sm text-fairy-700 font-bold flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            추천 NeoForge
          </span>
          <span className="text-sm font-extrabold text-fairy-800 bg-fairy-100 px-2 py-0.5 rounded-lg">
            21.1.217
          </span>
        </div>

        <div className="flex items-center justify-between p-3.5 bg-white/50 rounded-xl border border-forest-50 hover:bg-forest-50/50 transition-colors">
          <span className="text-sm text-forest-600 font-bold">
            {t("serverInfo.ping")}
          </span>
          <span className={`text-sm font-extrabold ${getPingColor(serverStatus?.ping)}`}>
            {serverStatus?.online && serverStatus.ping
              ? `${serverStatus.ping} ms`
              : "-"}
          </span>
        </div>
      </div>

      <div className="mt-6 pt-2">
        <Button
          variant="secondary"
          className="w-full bg-white/80 hover:bg-white text-fairy-600 border border-fairy-100 font-bold shadow-sm py-3"
          onClick={fetchServerStatus}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {t("serverInfo.refresh")}
        </Button>
      </div>
    </div>
  );
}
