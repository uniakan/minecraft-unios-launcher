import { useState, useEffect, useCallback } from 'react'
import { Sidebar } from '@widgets/sidebar'
import { Button, Card, CardContent, AlertModal, Footer } from '@shared/ui'
import { cn } from '@shared/lib'
import { useSettingsStore } from '@features/settings'
import { useTranslation } from '@shared/i18n'

export function ModsPage() {
  const [mods, setMods] = useState<ModInfo[]>([])
  const [shaders, setShaders] = useState<ShaderInfo[]>([])
  const [activeTab, setActiveTab] = useState<'mods' | 'shaders' | 'discover'>('mods')
  const [isLoading, setIsLoading] = useState(true)
  const { settings, loadSettings } = useSettingsStore()
  const { t } = useTranslation()

  // 알림 모달 상태
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  // 모드 스캔
  const scanMods = useCallback(async () => {
    if (!settings.gameDir) {
      setMods([])
      return
    }

    try {
      const result = await window.electronAPI?.mods.scan(settings.gameDir)
      if (result?.success && result.mods) {
        setMods(result.mods)
      } else {
        setMods([])
        if (result?.error) {
          console.error('모드 스캔 실패:', result.error)
        }
      }
    } catch (error) {
      console.error('모드 스캔 에러:', error)
      setMods([])
    }
  }, [settings.gameDir])

  // 셰이더 스캔
  const scanShaders = useCallback(async () => {
    if (!settings.gameDir) {
      setShaders([])
      return
    }

    try {
      const result = await window.electronAPI?.shaders.scan(settings.gameDir)
      if (result?.success && result.shaders) {
        setShaders(result.shaders)
      } else {
        setShaders([])
        if (result?.error) {
          console.error('셰이더 스캔 실패:', result.error)
        }
      }
    } catch (error) {
      console.error('셰이더 스캔 에러:', error)
      setShaders([])
    }
  }, [settings.gameDir])

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      if (settings.gameDir) {
        await Promise.all([scanMods(), scanShaders()])
      }
      setIsLoading(false)
    }
    loadData()
  }, [settings.gameDir, scanMods, scanShaders])

  // 모드 토글
  const toggleMod = async (filename: string) => {
    if (!settings.gameDir) return

    try {
      const result = await window.electronAPI?.mods.toggle(settings.gameDir, filename)
      if (result?.success && result.newFilename) {
        // 로컬 상태 업데이트
        setMods((prev) =>
          prev.map((mod) =>
            mod.filename === filename
              ? { ...mod, filename: result.newFilename!, enabled: !mod.enabled }
              : mod
          )
        )
      } else if (result?.error) {
        setAlertMessage(result.error)
        setIsAlertOpen(true)
      }
    } catch (error) {
      setAlertMessage(t('mods.alerts.unknown'))
      setIsAlertOpen(true)
    }
  }

  // 셰이더 토글
  const toggleShader = async (filename: string) => {
    if (!settings.gameDir) return

    try {
      const result = await window.electronAPI?.shaders.toggle(settings.gameDir, filename)
      if (result?.success && result.newFilename) {
        // 로컬 상태 업데이트
        setShaders((prev) =>
          prev.map((shader) =>
            shader.filename === filename
              ? { ...shader, filename: result.newFilename!, enabled: !shader.enabled }
              : shader
          )
        )
      } else if (result?.error) {
        setAlertMessage(result.error)
        setIsAlertOpen(true)
      }
    } catch (error) {
      setAlertMessage(t('mods.alerts.unknown'))
      setIsAlertOpen(true)
    }
  }

  const handleOpenModsFolder = async () => {
    if (!settings.gameDir) {
      setAlertMessage(t('mods.alerts.noGameDir'))
      setIsAlertOpen(true)
      return
    }

    // 경로 구분자 처리
    const separator = settings.gameDir.includes('\\') ? '\\' : '/'
    const modsPath = `${settings.gameDir}${separator}mods`

    try {
      // 1. 폴더 존재 여부 확인, 없으면 생성
      const exists = await window.electronAPI?.fs.exists(modsPath)

      if (!exists) {
        await window.electronAPI?.fs.mkdir(modsPath)
      }

      // 2. 탐색기 열기
      const error = await window.electronAPI?.shell.openPath(modsPath)
      if (error) {
        setAlertMessage(t('mods.alerts.openFail', { error }))
        setIsAlertOpen(true)
      }

      // 3. 폴더 열기 후 잠시 뒤 다시 스캔 (유저가 파일 추가할 수 있으므로)
      setTimeout(() => scanMods(), 2000)
    } catch (e) {
      setAlertMessage(t('mods.alerts.unknown'))
      setIsAlertOpen(true)
    }
  }

  const handleOpenShadersFolder = async () => {
    if (!settings.gameDir) {
      setAlertMessage(t('mods.alerts.noGameDir'))
      setIsAlertOpen(true)
      return
    }

    // 경로 구분자 처리
    const separator = settings.gameDir.includes('\\') ? '\\' : '/'
    const shadersPath = `${settings.gameDir}${separator}shaderpacks`

    try {
      // 1. 폴더 존재 여부 확인, 없으면 생성
      const exists = await window.electronAPI?.fs.exists(shadersPath)

      if (!exists) {
        await window.electronAPI?.fs.mkdir(shadersPath)
      }

      // 2. 탐색기 열기
      const error = await window.electronAPI?.shell.openPath(shadersPath)
      if (error) {
        setAlertMessage(t('mods.alerts.openFail', { error }))
        setIsAlertOpen(true)
      }

      // 3. 폴더 열기 후 잠시 뒤 다시 스캔 (유저가 파일 추가할 수 있으므로)
      setTimeout(() => scanShaders(), 2000)
    } catch (e) {
      setAlertMessage(t('mods.alerts.unknown'))
      setIsAlertOpen(true)
    }
  }

  const handleOpenExternal = async (url: string) => {
    try {
      await window.electronAPI?.shell.openExternal(url)
    } catch (error) {
      console.error('외부 링크 열기 실패:', error)
    }
  }

  const enabledModsCount = mods.filter((m) => m.enabled).length
  const totalModsCount = mods.length
  const enabledShadersCount = shaders.filter((s) => s.enabled).length
  const totalShadersCount = shaders.length

  return (
    <div className="h-full flex overflow-hidden">
      <Sidebar />

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full w-full glass-panel rounded-3xl overflow-y-auto p-8 shadow-2xl relative">
          {/* 헤더 */}
          <div className="flex items-center justify-between pb-6 border-b border-forest-100/50 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-forest-900 tracking-tight">{t('mods.title')}</h1>
              <p className="text-forest-500 mt-2 font-medium">{t('mods.subtitle')}</p>
            </div>

            {/* 폴더 열기 버튼 */}
            {activeTab === 'mods' && (
              <Button
                variant="secondary"
                onClick={handleOpenModsFolder}
                className="bg-white hover:bg-forest-50 border-forest-200 text-forest-700 font-bold shadow-sm"
              >
                <svg className="w-5 h-5 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
                {t('mods.openFolder')}
              </Button>
            )}
            {activeTab === 'shaders' && (
              <Button
                variant="secondary"
                onClick={handleOpenShadersFolder}
                className="bg-white hover:bg-forest-50 border-forest-200 text-forest-700 font-bold shadow-sm"
              >
                <svg className="w-5 h-5 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
                {t('shaders.openFolder')}
              </Button>
            )}
          </div>

          {/* 탭 */}
          <div className="flex gap-2 p-1.5 bg-forest-50 rounded-xl w-fit border border-forest-100 mb-6">
            <button
              onClick={() => setActiveTab('mods')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200',
                activeTab === 'mods'
                  ? 'bg-white text-fairy-600 shadow-sm border border-black/5'
                  : 'text-forest-400 hover:text-forest-700 hover:bg-forest-100/50'
              )}
            >
              {t('mods.tabs.mods')}
            </button>
            <button
              onClick={() => setActiveTab('shaders')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200',
                activeTab === 'shaders'
                  ? 'bg-white text-fairy-600 shadow-sm border border-black/5'
                  : 'text-forest-400 hover:text-forest-700 hover:bg-forest-100/50'
              )}
            >
              {t('mods.tabs.shaders')}
            </button>
            <button
              onClick={() => setActiveTab('discover')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200',
                activeTab === 'discover'
                  ? 'bg-white text-fairy-600 shadow-sm border border-black/5'
                  : 'text-forest-400 hover:text-forest-700 hover:bg-forest-100/50'
              )}
            >
              {t('mods.tabs.discover')}
            </button>
          </div>

          {activeTab === 'mods' ? (
            /* 모드 탭 */
            <>
              {/* 모드 상태 요약 */}
              {!isLoading && mods.length > 0 && (
                <div className="mb-4 flex items-center gap-2 text-sm text-forest-500">
                  <span className="font-bold text-forest-700">{enabledModsCount}</span>
                  <span>{t('mods.enabledOf')}</span>
                  <span className="font-bold text-forest-700">{totalModsCount}</span>
                  <span>{t('mods.modsEnabled')}</span>
                </div>
              )}

              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-forest-400">
                  <div className="w-10 h-10 border-4 border-fairy-200 border-t-fairy-500 rounded-full animate-spin mb-4" />
                  <p className="font-medium animate-pulse">{t('mods.loading')}</p>
                </div>
              ) : !settings.gameDir ? (
                <div className="flex flex-col items-center justify-center h-64 text-forest-400">
                  <svg className="w-16 h-16 mb-4 text-forest-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p className="font-medium text-center">{t('mods.alerts.noGameDir')}</p>
                </div>
              ) : mods.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-forest-400">
                  <svg className="w-16 h-16 mb-4 text-forest-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  <p className="font-medium">{t('mods.empty')}</p>
                  <p className="text-sm mt-2">{t('mods.emptyHint')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
                  {mods.map((mod) => (
                    <Card
                      key={mod.filename}
                      className={cn(
                        'border bg-white hover:shadow-md transition-all',
                        mod.enabled ? 'border-forest-100 hover:border-fairy-200' : 'border-forest-100/50 opacity-60'
                      )}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3
                                className={cn(
                                  'text-lg font-bold truncate',
                                  mod.enabled ? 'text-forest-800' : 'text-forest-500'
                                )}
                                title={mod.name}
                              >
                                {mod.name}
                              </h3>
                            </div>
                            <p
                              className="text-xs text-forest-400 font-mono truncate mb-2"
                              title={mod.filename}
                            >
                              {mod.filename}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-forest-400 font-medium">
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                  />
                                </svg>
                                {mod.size}
                              </span>
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded text-xs font-bold',
                                  mod.enabled
                                    ? 'bg-green-50 text-green-600 border border-green-100'
                                    : 'bg-gray-50 text-gray-500 border border-gray-100'
                                )}
                              >
                                {mod.enabled ? t('mods.enabled') : t('mods.disabled')}
                              </span>
                            </div>
                          </div>

                          {/* 토글 스위치 */}
                          <button
                            onClick={() => toggleMod(mod.filename)}
                            className={cn(
                              'relative w-11 h-6 rounded-full transition-colors flex-shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fairy-400',
                              mod.enabled ? 'bg-fairy-500' : 'bg-forest-200'
                            )}
                          >
                            <div
                              className={cn(
                                'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm',
                                mod.enabled ? 'translate-x-6' : 'translate-x-1'
                              )}
                            />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : activeTab === 'shaders' ? (
            /* 셰이더 탭 */
            <>
              {/* 셰이더 상태 요약 */}
              {!isLoading && shaders.length > 0 && (
                <div className="mb-4 flex items-center gap-2 text-sm text-forest-500">
                  <span className="font-bold text-forest-700">{enabledShadersCount}</span>
                  <span>{t('mods.enabledOf')}</span>
                  <span className="font-bold text-forest-700">{totalShadersCount}</span>
                  <span>{t('shaders.shadersEnabled')}</span>
                </div>
              )}

              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-forest-400">
                  <div className="w-10 h-10 border-4 border-fairy-200 border-t-fairy-500 rounded-full animate-spin mb-4" />
                  <p className="font-medium animate-pulse">{t('shaders.loading')}</p>
                </div>
              ) : !settings.gameDir ? (
                <div className="flex flex-col items-center justify-center h-64 text-forest-400">
                  <svg className="w-16 h-16 mb-4 text-forest-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p className="font-medium text-center">{t('mods.alerts.noGameDir')}</p>
                </div>
              ) : shaders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-forest-400">
                  <svg className="w-16 h-16 mb-4 text-forest-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  <p className="font-medium">{t('shaders.empty')}</p>
                  <p className="text-sm mt-2">{t('shaders.emptyHint')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
                  {shaders.map((shader) => (
                    <Card
                      key={shader.filename}
                      className={cn(
                        'border bg-white hover:shadow-md transition-all',
                        shader.enabled ? 'border-forest-100 hover:border-purple-200' : 'border-forest-100/50 opacity-60'
                      )}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3
                                className={cn(
                                  'text-lg font-bold truncate',
                                  shader.enabled ? 'text-forest-800' : 'text-forest-500'
                                )}
                                title={shader.name}
                              >
                                {shader.name}
                              </h3>
                            </div>
                            <p
                              className="text-xs text-forest-400 font-mono truncate mb-2"
                              title={shader.filename}
                            >
                              {shader.filename}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-forest-400 font-medium">
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                  />
                                </svg>
                                {shader.size}
                              </span>
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded text-xs font-bold',
                                  shader.enabled
                                    ? 'bg-purple-50 text-purple-600 border border-purple-100'
                                    : 'bg-gray-50 text-gray-500 border border-gray-100'
                                )}
                              >
                                {shader.enabled ? t('mods.enabled') : t('mods.disabled')}
                              </span>
                            </div>
                          </div>

                          {/* 토글 스위치 */}
                          <button
                            onClick={() => toggleShader(shader.filename)}
                            className={cn(
                              'relative w-11 h-6 rounded-full transition-colors flex-shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400',
                              shader.enabled ? 'bg-purple-500' : 'bg-forest-200'
                            )}
                          >
                            <div
                              className={cn(
                                'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm',
                                shader.enabled ? 'translate-x-6' : 'translate-x-1'
                              )}
                            />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* 모드 찾기 탭 */
            <div className="space-y-4 pb-10">
              <p className="text-sm text-forest-500 mb-6">{t('mods.discoverDesc')}</p>

              {/* Modrinth */}
              <Card
                variant="hover"
                className="border border-forest-100 bg-white hover:border-green-200 hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleOpenExternal('https://modrinth.com/mods')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-white" viewBox="0 0 512 514" fill="currentColor">
                        <path d="M503.16 323.56C514.55 281.47 515.32 235.91 503.2 190.76C466.57 54.2299 326.04 -26.8001 189.33 9.77991C83.8101 38.0199 11.3899 128.07 0.689941 230.47H43.99C54.29 147.33 113.74 74.7298 199.75 51.7098C306.05 23.2598 415.13 80.6699 453.17 181.38L411.03 192.65C391.64 145.8 352.57 111.45 306.3 96.8198L298.56 140.66C335.09 154.13 364.72 184.5 375.56 224.91C391.36 283.8 361.94 344.14 308.56 369.17L320.09 412.16C390.25 383.21 432.4 310.3 422.43 235.14L464.41 223.91C468.91 252.62 467.35 281.16 460.55 308.07L503.16 323.56Z" />
                        <path d="M321.99 504.22C185.27 540.8 44.7501 459.77 8.11011 323.24C3.84011 307.31 1.17 291.33 0 275.46H43.27C44.36 287.37 46.4699 299.35 49.6799 311.29C53.0399 323.8 57.45 335.75 62.79 347.07L101.38 323.92C98.1299 316.42 95.39 308.6 93.21 300.47C69.17 210.87 122.41 118.77 212.13 94.76C229.13 90.21 246.23 88.4299 262.93 89.1499L255.19 133C244.73 133.05 234.11 134.42 223.53 137.25C157.31 154.98 118.01 222.95 135.75 289.09C136.85 293.16 138.13 297.13 139.59 300.99L188.94 271.38L174.07 231.95L220.67 184.36L279.57 171.03L296.62 192.15L281.1 252.07L234.33 258.42L220.68 293.47L270.52 297.93L324.63 327.93L357.31 293.93L397.99 326.93L418.41 324.93L431.49 358.47C417.54 383.6 398.12 406.33 373.71 424.14L385.24 467.13C## 485.91 404.72 504.26 380.42 510.43 352.72L456.78 339.13C485.91 408.72 472.91 489.46 321.99 504.22Z" />
                        <path d="M255.19 133L226.44 117.27L281.1 85.1799L309.54 109.94L255.19 133Z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-forest-800 mb-1">Modrinth</h3>
                      <p className="text-sm text-forest-500">{t('mods.modrinthDesc')}</p>
                    </div>
                    <svg className="w-6 h-6 text-forest-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </CardContent>
              </Card>

              {/* CurseForge */}
              <Card
                variant="hover"
                className="border border-forest-100 bg-white hover:border-orange-200 hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleOpenExternal('https://www.curseforge.com/minecraft/search?class=mc-mods')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.326 9.2177C18.326 8.6797 18.235 8.1517 18.074 7.6577L23.7 4.4097V11.3117L18.265 14.4617V12.7497C18.265 12.3167 18.301 11.9277 18.301 11.6357C18.301 11.0357 18.235 10.5877 18.106 10.2127C17.977 9.8387 17.805 9.5327 17.578 9.2977C17.352 9.0637 17.084 8.8907 16.771 8.7867C16.457 8.6837 16.115 8.6297 15.745 8.6297C15.203 8.6297 14.703 8.7327 14.253 8.9527C13.803 9.1717 13.41 9.4677 13.081 9.8497L10.941 7.3457C11.469 6.8657 12.088 6.4867 12.795 6.2077C13.501 5.9287 14.296 5.7897 15.175 5.7897C16.063 5.7897 16.875 5.9287 17.61 6.2077C18.045 6.3777 18.443 6.5917 18.803 6.8497L20.2 5.0297L18.326 9.2177Z" />
                        <path d="M0 7.6577H6.916L5.25 10.4977H9.06L5.536 16.9097H0L3.524 10.4977H0V7.6577Z" />
                        <path d="M9.06 10.4977L11.316 6.5077H17.096L14.84 10.4977H9.06Z" />
                        <path d="M12.584 16.9097L15.982 10.4977H13.696C13.696 10.4977 14.116 11.5357 14.116 12.4337C14.116 13.5917 13.654 14.6587 12.73 15.6117C11.806 16.5647 10.558 17.3857 8.988 18.0757C7.418 18.7657 5.52 19.3207 3.296 19.7397L0 19.9997L3.524 16.9097H12.584Z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-forest-800 mb-1">CurseForge</h3>
                      <p className="text-sm text-forest-500">{t('mods.curseforgeDesc')}</p>
                    </div>
                    <svg className="w-6 h-6 text-forest-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 푸터 */}
          <Footer />
        </div>
      </div>

      {/* 알림 모달 */}
      <AlertModal isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)} message={alertMessage} />
    </div>
  )
}
