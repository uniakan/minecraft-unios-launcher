import { useState, useEffect } from 'react'
import { Sidebar } from '@widgets/sidebar'
import { Button, Card, CardContent } from '@shared/ui'
import { useSettingsStore } from '@features/settings'
import { cn } from '@shared/lib'
import { useTranslation } from '@shared/i18n'

interface MinecraftVersion {
  id: string
  type: 'release' | 'snapshot' | 'old_beta' | 'old_alpha'
  releaseTime: string
  installed: boolean
}

export function VersionsPage() {
  const { settings, setSelectedVersion, loadSettings } = useSettingsStore()
  const { t } = useTranslation()

  const [versions, setVersions] = useState<MinecraftVersion[]>([])
  const [filter, setFilter] = useState<'all' | 'release' | 'snapshot' | 'installed'>('release')
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [installingVersion, setInstallingVersion] = useState<string | null>(null)
  const [installProgress, setInstallProgress] = useState<{
    message: string
    progress: number
  } | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    if (settings.gameDir) {
      loadVersions()
    }
    setupInstallListeners()

    return () => {
      window.electronAPI?.minecraft.removeInstallListeners()
    }
  }, [settings.gameDir])

  const setupInstallListeners = () => {
    window.electronAPI?.minecraft.onInstallProgress((data) => {
      setInstallProgress({ message: data.message, progress: data.progress })

      if (data.stage === 'done') {
        setInstallingVersion(null)
        setInstallProgress(null)
        loadVersions() // 목록 새로고침
      }
    })

    window.electronAPI?.minecraft.onInstallError((data) => {
      console.error('설치 오류:', data.error)
      setInstallingVersion(null)
      setInstallProgress(null)
      alert(t('versions.alerts.installError', { error: data.error }))
    })
  }

  const loadVersions = async () => {
    setIsLoading(true)
    try {
      const manifestResult = await window.electronAPI?.minecraft.getVersionManifest()

      if (!manifestResult?.success || !manifestResult.data) {
        throw new Error(manifestResult?.error || t('versions.alerts.listError'))
      }

      const installedResult = await window.electronAPI?.minecraft.getInstalledVersions(settings.gameDir)
      const installedVersions = installedResult?.success ? installedResult.data || [] : []

      const versionList: MinecraftVersion[] = manifestResult.data.versions.map((v) => ({
        id: v.id,
        type: v.type,
        releaseTime: v.releaseTime,
        installed: installedVersions.includes(v.id),
      }))

      setVersions(versionList)
    } catch (error) {
      console.error('버전 목록 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredVersions = versions.filter((version) => {
    const matchesFilter = filter === 'all' || (filter === 'installed' && version.installed) || version.type === filter

    const matchesSearch = version.id.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesFilter && matchesSearch
  })

  const handleSelectVersion = (versionId: string) => {
    const version = versions.find((v) => v.id === versionId)
    if (version?.installed) {
      setSelectedVersion(versionId)
    }
  }

  const handleInstallVersion = async (versionId: string) => {
    if (installingVersion) return

    setInstallingVersion(versionId)
    setInstallProgress({ message: t('versions.list.installing'), progress: 0 })

    try {
      const result = await window.electronAPI?.minecraft.installVersion({
        versionId,
        gameDir: settings.gameDir,
      })

      if (!result?.success) {
        throw new Error(result?.error || t('versions.alerts.installError', { error: 'Unknown error' }))
      }
    } catch (error) {
      console.error('설치 오류:', error)
      setInstallingVersion(null)
      setInstallProgress(null)
      alert(t('versions.alerts.installError', { error: (error as Error).message }))
    }
  }

  const handleDeleteVersion = async (versionId: string) => {
    if (!confirm(t('versions.list.deleteConfirm', { version: versionId }))) return

    setIsLoading(true)
    try {
      const result = await window.electronAPI?.minecraft.deleteVersion({
        versionId,
        gameDir: settings.gameDir,
      })

      if (!result?.success) {
        throw new Error(result?.error || t('versions.alerts.deleteError', { error: 'Unknown error' }))
      }

      if (settings.selectedVersion === versionId) {
        setSelectedVersion('')
      }

      alert(t('versions.alerts.deleteSuccess', { version: versionId }))
      loadVersions()
    } catch (error) {
      console.error('삭제 오류:', error)
      alert(t('versions.alerts.deleteError', { error: (error as Error).message }))
      setIsLoading(false)
    }
  }

  const getVersionTypeLabel = (type: string) => {
    switch (type) {
      case 'release':
        return t('versions.types.release')
      case 'snapshot':
        return t('versions.types.snapshot')
      case 'old_beta':
        return t('versions.types.old_beta')
      case 'old_alpha':
        return t('versions.types.old_alpha')
      default:
        return type
    }
  }

  const getVersionTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'release':
        return 'bg-fairy-100 text-fairy-700 border border-fairy-200'
      case 'snapshot':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-200'
      case 'old_beta':
        return 'bg-blue-100 text-blue-700 border border-blue-200'
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200'
    }
  }

  return (
    <div className="h-full flex overflow-hidden">
      <Sidebar />

      {/* 메인 컨텐츠 영역: 전체 유리 패널 적용 */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full w-full glass-panel rounded-3xl overflow-y-auto p-8 shadow-2xl relative">
          {/* 헤더 */}
          <div className="flex items-center justify-between pb-6 border-b border-forest-100/50 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-forest-900 tracking-tight">{t('versions.title')}</h1>
              <p className="text-forest-500 mt-2 font-medium">{t('versions.subtitle')}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('versions.searchPlaceholder')}
                  className="input pl-10 w-64 bg-forest-50/50 border-forest-200 focus:bg-white"
                />
              </div>

              <Button
                variant="secondary"
                onClick={loadVersions}
                disabled={isLoading}
                className="bg-white hover:bg-forest-50 border-forest-200"
              >
                <svg
                  className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {t('versions.refresh')}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {/* 설치 진행률 */}
            {installingVersion && installProgress && (
              <div className="p-4 bg-fairy-50 border border-fairy-200 rounded-xl animate-slide-up shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-fairy-700">
                    {t('versions.installing', { version: installingVersion })}
                  </span>
                  <span className="text-sm text-fairy-600 font-mono">{installProgress.progress.toFixed(0)}%</span>
                </div>
                <div className="h-2.5 bg-fairy-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-fairy-400 to-fairy-500 transition-all duration-300 ease-out"
                    style={{ width: `${installProgress.progress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-fairy-600">
                  {installProgress.message.includes('클라이언트 다운로드 중')
                    ? `${t('versions.list.downloading')} ${installProgress.progress.toFixed(0)}%`
                    : installProgress.message}
                </p>
              </div>
            )}

            {/* 필터 탭 */}
            <div className="flex gap-2 p-1.5 bg-forest-50 rounded-xl w-fit border border-forest-100">
              {[
                { key: 'release', label: t('versions.filters.release') },
                { key: 'snapshot', label: t('versions.filters.snapshot') },
                { key: 'installed', label: t('versions.filters.installed') },
                { key: 'all', label: t('versions.filters.all') },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setFilter(item.key as typeof filter)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200',
                    filter === item.key
                      ? 'bg-white text-fairy-600 shadow-sm border border-black/5'
                      : 'text-forest-400 hover:text-forest-700 hover:bg-forest-100/50'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* 선택된 버전 표시 */}
            {settings.selectedVersion && (
              <div className="p-5 bg-gradient-to-r from-fairy-50 to-white border border-fairy-200 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('/icon.png')] bg-no-repeat bg-right-bottom opacity-5 -mr-4 -mb-4 w-32 h-32" />

                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-fairy-500 shadow-sm border border-fairy-100">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-fairy-600 font-bold mb-0.5">{t('versions.selected.title')}</p>
                    <p className="text-3xl font-extrabold text-forest-800 tracking-tight">{settings.selectedVersion}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedVersion('')}
                  className="text-forest-400 hover:text-red-500 hover:bg-red-50 relative z-10 font-medium"
                >
                  {t('versions.selected.deselect')}
                </Button>
              </div>
            )}

            {/* 버전 목록 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
              {isLoading ? (
                <div className="col-span-full flex flex-col items-center justify-center h-64 text-forest-400">
                  <div className="w-10 h-10 border-4 border-fairy-200 border-t-fairy-500 rounded-full animate-spin mb-4" />
                  <p className="font-medium animate-pulse">{t('versions.list.loading')}</p>
                </div>
              ) : filteredVersions.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center h-64 text-forest-400 opacity-70">
                  <svg className="w-16 h-16 mb-4 text-forest-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="font-medium">{t('versions.list.empty')}</p>
                </div>
              ) : (
                filteredVersions.slice(0, 50).map((version) => (
                  <Card
                    key={version.id}
                    variant="hover"
                    className={cn(
                      'transition-all duration-200 border bg-white shadow-sm',
                      settings.selectedVersion === version.id
                        ? 'ring-2 ring-fairy-400 border-fairy-400 bg-fairy-50/30'
                        : 'border-forest-100 hover:border-fairy-300 hover:shadow-md'
                    )}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-forest-800 tracking-tight">{version.id}</h3>
                          <p className="text-xs text-forest-400 font-medium mt-1">
                            {t('versions.list.releaseDate', {
                              date: new Date(version.releaseTime).toLocaleDateString(),
                            })}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-bold shadow-sm ${getVersionTypeBadgeClass(
                            version.type
                          )}`}
                        >
                          {getVersionTypeLabel(version.type)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-auto">
                        {version.installed ? (
                          <>
                            <Button
                              variant={settings.selectedVersion === version.id ? 'primary' : 'secondary'}
                              size="sm"
                              className={`flex-1 font-bold shadow-none ${
                                settings.selectedVersion === version.id
                                  ? 'bg-fairy-500 hover:bg-fairy-600'
                                  : 'bg-forest-50 hover:bg-forest-100'
                              }`}
                              onClick={() => handleSelectVersion(version.id)}
                            >
                              {settings.selectedVersion === version.id
                                ? t('versions.list.selected')
                                : t('versions.list.select')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteVersion(version.id)}
                              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 border border-red-100 transition-colors"
                              title={t('versions.list.delete')}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1 text-fairy-600 font-bold bg-white border border-fairy-100 hover:bg-fairy-50 hover:border-fairy-200"
                            onClick={() => handleInstallVersion(version.id)}
                            disabled={installingVersion !== null}
                            isLoading={installingVersion === version.id}
                          >
                            {installingVersion === version.id
                              ? t('versions.list.installing')
                              : t('versions.list.install')}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
