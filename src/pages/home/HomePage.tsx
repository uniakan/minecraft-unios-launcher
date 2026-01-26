import { useState, useEffect } from 'react'
import { Sidebar } from '@widgets/sidebar'
import { Button, AlertModal, Footer } from '@shared/ui'
import { useAuthStore } from '@features/auth'
import { useSettingsStore } from '@features/settings'
import { useGameLaunchStore } from '@features/game-launch'
import { GameConsole } from './ui/GameConsole'
import { LaunchProgress } from './ui/LaunchProgress'
import { ServerInfo } from './ui/ServerInfo'
import { useTranslation } from '@shared/i18n'

export function HomePage() {
  const { user } = useAuthStore()
  const { settings, loadSettings } = useSettingsStore()
  const { status, setStatus, addLog, setProgress, setError, setPid, reset, logs } = useGameLaunchStore()
  const [isLaunching, setIsLaunching] = useState(false)
  const { t } = useTranslation()

  // 알림 모달 상태
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  // 로그 모니터링 및 Java 버전 에러 감지
  useEffect(() => {
    if (logs.length === 0) return

    const lastLog = logs[logs.length - 1]
    if (!lastLog) return

    // Java 버전 호환성 에러 감지 (UnsupportedClassVersionError)
    if (
      lastLog.message.includes('UnsupportedClassVersionError') ||
      (lastLog.message.includes('class file version 65.0') && lastLog.message.includes('61.0'))
    ) {
      setAlertMessage(
        `${t('home.javaError.title')}\n\n` +
          `${t('home.javaError.desc')}\n\n` +
          `${t('home.javaError.versionReq')}\n\n` +
          `${t('home.javaError.action1')}\n` +
          `${t('home.javaError.action2')}`
      )
      setIsAlertOpen(true)

      // 상태를 에러로 변경하고 실행 중지
      setStatus('error')
      setIsLaunching(false)
    }
  }, [logs, setStatus])

  useEffect(() => {
    // 게임 이벤트 리스너 설정
    const setupListeners = () => {
      window.electronAPI?.game.onLog((data) => {
        addLog({ type: data.type as 'stdout' | 'stderr', message: data.data })
      })

      window.electronAPI?.game.onExit((data) => {
        addLog({
          type: 'info',
          message: `게임이 종료되었습니다. (종료 코드: ${data.code})`,
        })
        setStatus('idle')
        setIsLaunching(false)
        setPid(null)
      })

      window.electronAPI?.game.onError((data) => {
        addLog({ type: 'error', message: data.error })
        setError(data.error)
        setIsLaunching(false)
      })
    }

    setupListeners()

    return () => {
      window.electronAPI?.game.removeAllListeners()
    }
  }, [])

  const handleLaunchGame = async () => {
    if (!user) {
      setError('로그인이 필요합니다.')
      return
    }

    if (!settings.selectedVersion) {
      setError('버전을 선택해주세요.')
      return
    }

    if (!settings.javaPath) {
      setError('Java 경로가 설정되지 않았습니다. 설정에서 Java를 선택해주세요.')
      return
    }

    // NeoForge 버전인지 확인
    const isNeoForge = settings.selectedVersion.startsWith('neoforge-')

    // 설치된 버전 확인 (NeoForge와 바닐라 분리)
    const installedResult = isNeoForge
      ? await window.electronAPI?.neoforge.getInstalledVersions(settings.gameDir)
      : await window.electronAPI?.minecraft.getInstalledVersions(settings.gameDir)
    const installedVersions = installedResult?.success ? installedResult.data || [] : []

    if (!installedVersions.includes(settings.selectedVersion)) {
      setError(`${settings.selectedVersion} 버전이 설치되어 있지 않습니다. 버전 페이지에서 먼저 설치해주세요.`)
      return
    }

    setIsLaunching(true)
    reset()
    setStatus('preparing')
    setProgress(0, '게임 준비 중...')
    addLog({ type: 'info', message: '게임 실행을 시작합니다...' })

    try {
      setProgress(30, '게임 실행 중...')
      setStatus('launching')
      addLog({ type: 'info', message: `Java: ${settings.javaPath}` })
      addLog({ type: 'info', message: `버전: ${settings.selectedVersion}` })
      addLog({
        type: 'info',
        message: `메모리: ${settings.memory.min}MB - ${settings.memory.max}MB`,
      })

      // NeoForge 버전이면 neoforge.launch, 아니면 game.launch 사용
      const result = isNeoForge
        ? await window.electronAPI?.neoforge.launch({
            javaPath: settings.javaPath,
            gameDir: settings.gameDir,
            versionId: settings.selectedVersion,
            username: user.username,
            uuid: user.uuid,
            accessToken: user.accessToken,
            memoryMin: settings.memory.min,
            memoryMax: settings.memory.max,
            resolution: {
              width: settings.resolution.fullscreen ? 1920 : settings.resolution.width,
              height: settings.resolution.fullscreen ? 1080 : settings.resolution.height,
              fullscreen: settings.resolution.fullscreen,
            },
          })
        : await window.electronAPI?.game.launch({
            javaPath: settings.javaPath,
            gameDir: settings.gameDir,
            version: settings.selectedVersion,
            username: user.username,
            uuid: user.uuid,
            accessToken: user.accessToken,
            memoryMin: settings.memory.min,
            memoryMax: settings.memory.max,
            resolution: {
              width: settings.resolution.fullscreen ? 1920 : settings.resolution.width,
              height: settings.resolution.fullscreen ? 1080 : settings.resolution.height,
              fullscreen: settings.resolution.fullscreen,
            },
          })

      if (result?.success) {
        setProgress(100, '게임이 실행되었습니다!')
        setStatus('running')
        setPid(result.pid || null)
        addLog({
          type: 'info',
          message: `게임 프로세스가 시작되었습니다. (PID: ${result.pid})`,
        })
      } else {
        throw new Error(result?.error || '게임 실행에 실패했습니다.')
      }
    } catch (error) {
      const errorMessage = (error as Error).message
      setError(errorMessage)
      addLog({ type: 'error', message: errorMessage })
      setIsLaunching(false)
    }
  }

  const handleKillGame = async () => {
    const result = await window.electronAPI?.game.kill()
    if (result?.success) {
      addLog({ type: 'info', message: '게임이 강제 종료되었습니다.' })
      setStatus('idle')
      setIsLaunching(false)
      setPid(null)
    }
  }

  return (
    <div className="h-full flex overflow-hidden">
      <Sidebar />

      {/* 메인 컨텐츠 영역: 투명 배경 */}
      <div className="flex-1 p-6 overflow-y-auto relative z-10 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 1. 상단 웰컴 카드 */}
          <div className="glass-panel rounded-3xl p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/90 backdrop-blur-xl border border-white/60">
            <div>
              <h1 className="text-4xl font-extrabold text-forest-900 mb-2 tracking-tight drop-shadow-sm">
                <span
                  dangerouslySetInnerHTML={{
                    __html: t('home.welcome', {
                      name: user?.username || 'Guest',
                    }),
                  }}
                />
              </h1>
              <p className="text-lg text-forest-600 font-bold opacity-90">{t('home.subtitle')}</p>
            </div>

            <div className="shrink-0 h-[60px] flex items-center">
              {status === 'running' ? (
                <Button
                  variant="danger"
                  onClick={handleKillGame}
                  className="min-w-[200px] h-full text-lg shadow-lg shadow-red-200/50 hover:shadow-red-200/80 transition-all duration-300 font-bold border-2 border-white/20 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {t('home.gameStop')}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleLaunchGame}
                  isLoading={isLaunching && status !== 'running'}
                  disabled={!settings.selectedVersion || !settings.javaPath}
                  className="min-w-[200px] h-full text-lg shadow-xl shadow-fairy-500/30 hover:shadow-fairy-500/50 transition-all duration-300 font-bold border-2 border-white/20 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]"
                >
                  {!settings.javaPath ? (
                    t('home.javaSelect')
                  ) : !settings.selectedVersion ? (
                    t('home.verSelect')
                  ) : (
                    <>
                      <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      {t('home.gameStart')}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* 에러 및 진행상황 */}
          <div className="space-y-4">
            {status === 'error' && (
              <div className="glass-card bg-red-50/95 border-red-200 p-4 rounded-2xl flex items-center gap-3 text-red-700 shadow-md animate-slide-up">
                <svg className="w-6 h-6 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="font-bold">{t('home.error.title')}</p>
                  <p className="text-sm opacity-90">{useGameLaunchStore.getState().error}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="text-red-600 hover:bg-red-100 font-bold"
                >
                  {t('home.error.close')}
                </Button>
              </div>
            )}

            {(status === 'preparing' || status === 'launching') && (
              <div className="glass-panel p-6 rounded-2xl bg-white/90">
                <LaunchProgress />
              </div>
            )}
          </div>

          {/* 메인 정보 그리드 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 2. 서버 정보 카드 */}
            <div className="lg:col-span-2 glass-panel rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/90 flex flex-col gap-4">
              <h3 className="text-xl font-bold text-forest-800 flex items-center gap-2 border-b border-forest-100 pb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-forest-400 shadow-sm"></span>
                {t('home.serverStatus')}
              </h3>
              <div className="flex-1">
                <ServerInfo />
              </div>
            </div>

            {/* 3. 빠른 설정 카드 */}
            <div className="glass-panel bg-white/90 rounded-3xl p-6 h-full shadow-lg hover:shadow-xl transition-all duration-300 border border-white/60 flex flex-col gap-5">
              <h3 className="text-xl font-bold text-forest-800 flex items-center gap-2 border-b border-forest-100 pb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-fairy-400 shadow-sm"></span>
                {t('home.quickSettings')}
              </h3>

              <div className="space-y-5 flex-1">
                <div className="flex items-center justify-between group">
                  <span className="text-sm text-forest-600 font-bold">{t('home.selectedVer')}</span>
                  <span
                    className={`text-sm font-extrabold px-3 py-1.5 rounded-xl transition-colors shadow-sm ${
                      settings.selectedVersion
                        ? 'text-fairy-700 bg-fairy-50 border border-fairy-100'
                        : 'text-red-500 bg-red-50 border border-red-100'
                    }`}
                  >
                    {settings.selectedVersion || '선택 안됨'}
                  </span>
                </div>

                <div className="flex items-center justify-between group">
                  <span className="text-sm text-forest-600 font-bold">{t('home.javaPath')}</span>
                  <span
                    className={`text-sm font-semibold truncate max-w-[140px] px-3 py-1.5 rounded-xl border ${
                      settings.javaPath
                        ? 'text-forest-700 bg-forest-50 border-forest-100'
                        : 'text-red-500 bg-red-50 border-red-100'
                    }`}
                    title={settings.javaPath}
                  >
                    {settings.javaPath ? settings.javaPath.split(/[/\\]/).pop() : '미설정'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-forest-600 font-bold">{t('home.memory')}</span>
                  <span className="text-sm font-bold text-forest-700 bg-forest-50 px-3 py-1.5 rounded-xl border border-forest-100 shadow-sm">
                    {(settings.memory.max / 1024).toFixed(1)} GB
                  </span>
                </div>
              </div>

              {/* 게임 상태 인디케이터 (하단 고정) */}
              <div className="pt-2 mt-auto">
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-forest-50 border border-forest-100 shadow-inner">
                  <div className="relative flex h-3 w-3 shrink-0">
                    {status === 'running' && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fairy-400 opacity-75"></span>
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-3 w-3 ${
                        status === 'running'
                          ? 'bg-fairy-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                          : status === 'error'
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                      }`}
                    ></span>
                  </div>
                  <span className="text-xs font-bold text-forest-700 truncate">
                    {status === 'idle' && t('home.status.idle')}
                    {status === 'preparing' && t('home.status.preparing')}
                    {status === 'launching' && t('home.status.launching')}
                    {status === 'running' && t('home.status.running')}
                    {status === 'error' && t('home.status.error')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. 실행 로그 (콘솔 카드) */}
          <div className="glass-panel rounded-3xl p-6 shadow-xl bg-white/90 border border-white/60 mb-6 flex flex-col gap-4">
            <h3 className="text-xl font-bold text-forest-800 flex items-center gap-2 border-b border-forest-100 pb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-500 shadow-sm"></span>
              {t('home.logs')}
            </h3>
            <div className="rounded-2xl overflow-hidden border-2 border-forest-100/50 shadow-inner bg-black/95 h-64">
              <GameConsole />
            </div>
          </div>

          <Footer />
        </div>
      </div>

      {/* 알림 모달 */}
      <AlertModal isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)} message={alertMessage} />
    </div>
  )
}
