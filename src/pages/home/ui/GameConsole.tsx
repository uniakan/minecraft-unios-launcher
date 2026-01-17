import { useEffect, useRef, useState } from 'react'
import { Card, CardHeader, CardContent } from '@shared/ui'
import { useGameLaunchStore } from '@features/game-launch'
import { useTranslation } from '@shared/i18n'

export function GameConsole() {
  const { logs } = useGameLaunchStore()
  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  const handleCopyLogs = async () => {
    if (logs.length === 0) return

    try {
      // 로그 메시지만 추출하여 복사
      const logText = logs.map((log) => log.message).join('\n')
      await navigator.clipboard.writeText(logText)

      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('로그 복사 실패:', err)
    }
  }

  if (logs.length === 0) return null

  return (
    <Card className="bg-forest-900 border-forest-800 text-forest-100 overflow-hidden shadow-inner">
      <CardHeader className="py-2.5 px-4 border-b border-forest-800 bg-forest-950/50 flex flex-row items-center justify-between">
        <h3 className="text-sm font-semibold text-fairy-300 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {t('home.logTitle')}
        </h3>

        <div className="flex items-center gap-3">
          <span className="text-xs text-forest-500 font-mono hidden sm:inline">{t('home.realTimeOutput')}</span>

          {/* 로그 복사 버튼 */}
          <button
            onClick={handleCopyLogs}
            className="text-forest-400 hover:text-white hover:bg-white/10 p-1.5 rounded transition-all active:scale-95"
            title={t('home.copy')}
          >
            {isCopied ? (
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
            )}
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div
          ref={scrollRef}
          className="h-48 overflow-y-auto p-4 font-mono text-xs space-y-1 selection:bg-fairy-900 selection:text-white custom-scrollbar"
        >
          {logs.map((log, index) => (
            <div
              key={index}
              className={`${
                log.type === 'error' ? 'text-red-400' : log.type === 'stderr' ? 'text-yellow-400' : 'text-forest-200'
              }`}
            >
              <span className="opacity-50 mr-2 select-none">[{new Date().toLocaleTimeString()}]</span>
              <span className="break-all whitespace-pre-wrap">{log.message}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
