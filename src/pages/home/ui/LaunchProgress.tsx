import { useGameLaunchStore } from "@features/game-launch";

export function LaunchProgress() {
  const { progress, progressMessage, status } = useGameLaunchStore();

  if (status === "idle" || status === "running" || status === "error")
    return null;

  return (
    <div className="p-5 bg-white/70 border border-fairy-200 rounded-xl shadow-lg shadow-fairy-400/10 animate-slide-up backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-forest-800 flex items-center gap-2">
          {status === "preparing" ? (
            <svg
              className="w-4 h-4 animate-spin text-fairy-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <svg
              className="w-4 h-4 animate-bounce text-fairy-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          )}
          {progressMessage}
        </span>
        <span className="text-sm font-bold text-fairy-600 bg-fairy-50 px-2 py-0.5 rounded">
          {Math.round(progress)}%
        </span>
      </div>

      <div className="h-3 bg-forest-100 rounded-full overflow-hidden shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-fairy-400 via-fairy-500 to-sky-400 transition-all duration-500 ease-out relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]" />
        </div>
      </div>
    </div>
  );
}
