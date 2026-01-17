import { useState, useEffect } from 'react'
import { Sidebar } from '@widgets/sidebar'
import { Button, Card, CardContent, CardHeader, Input } from '@shared/ui'
import { useSettingsStore } from '@features/settings'
import { cn } from '@shared/lib'
import { useTranslation } from '@shared/i18n'

export function SettingsPage() {
  const { settings, setJavaPath, setMemory, setResolution, setJvmArgs, loadSettings } = useSettingsStore()
  const [javaPaths, setJavaPaths] = useState<string[]>([])
  const [customJvmArgs, setCustomJvmArgs] = useState(settings.jvmArgs.join('\n'))
  const { t } = useTranslation()

  useEffect(() => {
    loadSettings()
    loadJavaPaths()
  }, [])

  const loadJavaPaths = async () => {
    try {
      const paths = await window.electronAPI.java.findPath()
      setJavaPaths(paths)
    } catch (error) {
      console.error('Java 경로 탐색 실패:', error)
    }
  }

  const handleSaveJvmArgs = () => {
    const args = customJvmArgs
      .split('\n')
      .map((arg) => arg.trim())
      .filter((arg) => arg.length > 0)
    setJvmArgs(args)
  }

  const memoryOptions = [
    { value: 2048, label: '2 GB' },
    { value: 4096, label: '4 GB' },
    { value: 6144, label: '6 GB' },
    { value: 8192, label: '8 GB' },
    { value: 12288, label: '12 GB' },
    { value: 16384, label: '16 GB' },
  ]

  const resolutionOptions = [
    { width: 1280, height: 720, label: '1280 x 720 (HD)' },
    { width: 1920, height: 1080, label: '1920 x 1080 (Full HD)' },
    { width: 2560, height: 1440, label: '2560 x 1440 (2K)' },
    { width: 3840, height: 2160, label: '3840 x 2160 (4K)' },
  ]

  return (
    <div className="h-full flex overflow-hidden">
      <Sidebar />

      {/* 메인 컨텐츠 영역: 전체 유리 패널 적용 */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full w-full glass-panel rounded-3xl overflow-y-auto p-8 shadow-2xl relative">
          {/* 헤더 */}
          <div className="pb-6 border-b border-forest-100/50 mb-6">
            <h1 className="text-3xl font-bold text-forest-900 tracking-tight">{t('settings.title')}</h1>
            <p className="text-forest-500 mt-2 font-medium">{t('settings.subtitle')}</p>
          </div>

          <div className="space-y-6 pb-10">
            {/* Java 설정 */}
            <Card className="glass-card shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="border-b border-forest-50 bg-forest-50/30">
                <h2 className="text-lg font-bold text-forest-800 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-fairy-600 shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                      />
                    </svg>
                  </div>
                  {t('settings.java.title')}
                </h2>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div>
                  <label className="text-sm font-bold text-forest-700 mb-2 block">{t('settings.java.path')}</label>
                  <select
                    value={settings.javaPath}
                    onChange={(e) => setJavaPath(e.target.value)}
                    className="input bg-white border-forest-200 text-forest-900 w-full rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-fairy-400 focus:border-fairy-400"
                  >
                    <option value="">{t('settings.java.pathSelect')}</option>
                    {javaPaths.map((path, index) => (
                      <option key={index} value={path}>
                        {path}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-forest-400 mt-2 font-medium">{t('settings.java.pathDesc')}</p>
                </div>

                <div>
                  <label className="text-sm font-bold text-forest-700 mb-2 block">{t('settings.java.jvmArgs')}</label>
                  <textarea
                    value={customJvmArgs}
                    onChange={(e) => setCustomJvmArgs(e.target.value)}
                    className="input min-h-[120px] font-mono text-sm resize-y bg-white border-forest-200 text-forest-900 w-full rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-fairy-400 focus:border-fairy-400"
                    placeholder={t('settings.java.jvmArgsPlaceholder')}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-forest-400 font-medium">{t('settings.java.jvmArgsDesc')}</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSaveJvmArgs}
                      className="bg-forest-50 hover:bg-forest-100 font-bold border border-forest-100"
                    >
                      {t('settings.java.save')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 메모리 설정 */}
            <Card className="glass-card shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="border-b border-forest-50 bg-forest-50/30">
                <h2 className="text-lg font-bold text-forest-800 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-fairy-600 shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                      />
                    </svg>
                  </div>
                  {t('settings.memory.title')}
                </h2>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div>
                  <label className="text-sm font-bold text-forest-700 mb-3 block">
                    {t('settings.memory.maxAlloc')}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {memoryOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setMemory(1024, option.value)}
                        className={cn(
                          'p-3 rounded-lg border transition-all text-sm font-bold shadow-sm',
                          settings.memory.max === option.value
                            ? 'bg-fairy-500 border-fairy-500 text-white shadow-md ring-2 ring-fairy-200 ring-offset-1'
                            : 'bg-white border-forest-100 text-forest-500 hover:bg-forest-50 hover:border-fairy-200'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-forest-400 mt-2 font-medium">{t('settings.memory.recommend')}</p>
                </div>

                {/* 메모리 미리보기 바 */}
                <div className="p-5 bg-forest-50/50 rounded-xl border border-forest-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-forest-600 font-bold">{t('settings.memory.alloc')}</span>
                    <span className="text-sm font-extrabold text-forest-800 bg-white px-2 py-0.5 rounded shadow-sm">
                      {settings.memory.min / 1024}GB - {settings.memory.max / 1024}
                      GB
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-white border border-forest-100 overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-fairy-400 to-sky-400 transition-all duration-300"
                      style={{
                        width: `${(settings.memory.max / 16384) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 디스플레이 설정 */}
            <Card className="glass-card shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="border-b border-forest-50 bg-forest-50/30">
                <h2 className="text-lg font-bold text-forest-800 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-fairy-600 shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  {t('settings.display.title')}
                </h2>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div>
                  <label className="text-sm font-bold text-forest-700 mb-3 block">
                    {t('settings.display.resolution')}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {resolutionOptions.map((option) => (
                      <button
                        key={option.label}
                        onClick={() => setResolution(option.width, option.height, false)}
                        className={cn(
                          'p-3 rounded-lg border transition-all text-left text-sm font-medium shadow-sm',
                          settings.resolution.width === option.width &&
                            settings.resolution.height === option.height &&
                            !settings.resolution.fullscreen
                            ? 'bg-fairy-500 border-fairy-500 text-white font-bold shadow-md ring-2 ring-fairy-200 ring-offset-1'
                            : 'bg-white border-forest-100 text-forest-500 hover:bg-forest-50 hover:border-fairy-200'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-5 bg-forest-50/50 rounded-xl border border-forest-100">
                  <div>
                    <p className="text-sm font-bold text-forest-800">{t('settings.display.fullscreen')}</p>
                    <p className="text-xs text-forest-500 mt-1 font-medium">{t('settings.display.fullscreenDesc')}</p>
                  </div>
                  <button
                    onClick={() =>
                      setResolution(
                        settings.resolution.width,
                        settings.resolution.height,
                        !settings.resolution.fullscreen
                      )
                    }
                    className={cn(
                      'relative w-12 h-7 rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fairy-400',
                      settings.resolution.fullscreen ? 'bg-fairy-500' : 'bg-forest-200'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-md',
                        settings.resolution.fullscreen ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
