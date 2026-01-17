import { Button } from "@shared/ui";
import { useTranslation } from "@shared/i18n";

export function ServerInfo() {
  const { t } = useTranslation();

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
        <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold border border-green-200 shadow-sm flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          {t("serverInfo.online")}
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-3 flex-1">
        <div className="flex items-center justify-between p-3.5 bg-white/50 rounded-xl border border-forest-50 hover:bg-forest-50/50 transition-colors">
          <span className="text-sm text-forest-600 font-bold">
            {t("serverInfo.players")}
          </span>
          <span className="text-sm font-extrabold text-forest-800">
            128 / 500
          </span>
        </div>

        <div className="flex items-center justify-between p-3.5 bg-white/50 rounded-xl border border-forest-50 hover:bg-forest-50/50 transition-colors">
          <span className="text-sm text-forest-600 font-bold">
            {t("serverInfo.version")}
          </span>
          <span className="text-sm font-extrabold text-forest-800">1.20.4</span>
        </div>

        <div className="flex items-center justify-between p-3.5 bg-white/50 rounded-xl border border-forest-50 hover:bg-forest-50/50 transition-colors">
          <span className="text-sm text-forest-600 font-bold">
            {t("serverInfo.ping")}
          </span>
          <span className="text-sm font-extrabold text-green-600">12 ms</span>
        </div>
      </div>

      <div className="mt-6 pt-2">
        <Button
          variant="secondary"
          className="w-full bg-white/80 hover:bg-white text-fairy-600 border border-fairy-100 font-bold shadow-sm py-3"
        >
          {t("serverInfo.moreInfo")}
        </Button>
      </div>
    </div>
  );
}
