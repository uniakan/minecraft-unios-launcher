import { useState, useEffect } from 'react'
import { Sidebar } from '@widgets/sidebar'
import { Button, Card, CardContent, AlertModal, Footer } from '@shared/ui'
import { cn } from '@shared/lib'
import { useSettingsStore } from '@features/settings'
import { useTranslation } from '@shared/i18n'

interface Mod {
  id: string
  name: string
  version: string
  description: string
  author: string
  enabled: boolean
  size: string
  downloadUrl?: string
}

interface ModPack {
  id: string
  name: string
  description: string
  version: string
  minecraftVersion: string
  mods: Mod[]
  installed: boolean
}

export function ModsPage() {
  const [mods, setMods] = useState<Mod[]>([])
  const [modPacks, setModPacks] = useState<ModPack[]>([])
  const [activeTab, setActiveTab] = useState<'mods' | 'modpacks'>('modpacks')
  const [isLoading, setIsLoading] = useState(true)
  const { settings, loadSettings } = useSettingsStore()
  const { t } = useTranslation()

  // 알림 모달 상태
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  useEffect(() => {
    loadSettings()
    loadModsData()
  }, [])

  const loadModsData = async () => {
    setIsLoading(true)
    try {
      // 데모 데이터 (실제로는 파일 시스템이나 API에서 로드해야 함)
      const demoMods: Mod[] = [
        {
          id: '1',
          name: 'OptiFine',
          version: 'HD U I7',
          description: '그래픽 최적화 및 셰이더 지원',
          author: 'sp614x',
          enabled: true,
          size: '6.5 MB',
        },
        {
          id: '2',
          name: 'JEI (Just Enough Items)',
          version: '15.2.0',
          description: '아이템 레시피 확인 모드',
          author: 'mezz',
          enabled: true,
          size: '1.2 MB',
        },
        {
          id: '3',
          name: 'Create',
          version: '0.5.1',
          description: '기계와 자동화 모드',
          author: 'simibubi',
          enabled: true,
          size: '15.3 MB',
        },
        {
          id: '4',
          name: 'Sodium',
          version: '0.5.5',
          description: '렌더링 성능 개선',
          author: 'CaffeineMC',
          enabled: false,
          size: '2.1 MB',
        },
      ]

      const demoModPacks: ModPack[] = [
        {
          id: '1',
          name: 'Unios 공식 모드팩',
          description: '서버 공식 권장 모드팩. 최적의 게임 경험을 위해 설정되어 있습니다.',
          version: '1.2.0',
          minecraftVersion: '1.20.1',
          mods: demoMods.filter((m) => m.enabled),
          installed: true,
        },
        {
          id: '2',
          name: 'Create: Above and Beyond',
          description: 'Create 모드 중심의 기술/자동화 모드팩',
          version: '1.5.0',
          minecraftVersion: '1.20.1',
          mods: [],
          installed: false,
        },
        {
          id: '3',
          name: 'All the Mods 9',
          description: '다양한 모드가 포함된 대형 모드팩',
          version: '0.2.50',
          minecraftVersion: '1.20.1',
          mods: [],
          installed: false,
        },
      ]

      setMods(demoMods)
      setModPacks(demoModPacks)
    } catch (error) {
      console.error('모드 데이터 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMod = (modId: string) => {
    setMods((prev) => prev.map((mod) => (mod.id === modId ? { ...mod, enabled: !mod.enabled } : mod)))
  }

  const installModPack = (modPackId: string) => {
    console.log('모드팩 설치:', modPackId)
    setModPacks((prev) => prev.map((pack) => (pack.id === modPackId ? { ...pack, installed: true } : pack)))
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
      // 1. 폴더 존재 여부 확인 (시스템 팝업 방지)
      const exists = await window.electronAPI?.fs.exists(modsPath)

      if (!exists) {
        setAlertMessage(t('mods.alerts.noFolder', { path: modsPath }))
        setIsAlertOpen(true)
        return
      }

      // 2. 존재할 경우 탐색기 열기
      const error = await window.electronAPI?.shell.openPath(modsPath)
      if (error) {
        setAlertMessage(t('mods.alerts.openFail', { error }))
        setIsAlertOpen(true)
      }
    } catch (e) {
      setAlertMessage(t('mods.alerts.unknown'))
      setIsAlertOpen(true)
    }
  }

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

            {/* 모드 폴더 열기 버튼 */}
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
          </div>

          {/* 탭 */}
          <div className="flex gap-2 p-1.5 bg-forest-50 rounded-xl w-fit border border-forest-100 mb-6">
            <button
              onClick={() => setActiveTab('modpacks')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200',
                activeTab === 'modpacks'
                  ? 'bg-white text-fairy-600 shadow-sm border border-black/5'
                  : 'text-forest-400 hover:text-forest-700 hover:bg-forest-100/50'
              )}
            >
              {t('mods.tabs.modpacks')}
            </button>
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
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-forest-400">
              <div className="w-10 h-10 border-4 border-fairy-200 border-t-fairy-500 rounded-full animate-spin mb-4" />
              <p className="font-medium animate-pulse">{t('mods.loading')}</p>
            </div>
          ) : activeTab === 'modpacks' ? (
            /* 모드팩 목록 */
            <div className="space-y-4 pb-10">
              {modPacks.map((pack) => (
                <Card
                  key={pack.id}
                  variant="hover"
                  className="border border-forest-100 bg-white hover:border-fairy-200 hover:shadow-md transition-all"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-forest-800 tracking-tight">{pack.name}</h3>
                          {pack.installed && (
                            <span className="px-2.5 py-0.5 bg-fairy-50 text-fairy-600 border border-fairy-100 rounded text-xs font-bold">
                              {t('mods.installed')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-forest-500 mb-3 font-medium">{pack.description}</p>
                        <div className="flex items-center gap-4 text-xs text-forest-400 font-bold">
                          <span className="bg-forest-50 px-2 py-0.5 rounded text-forest-500">v{pack.version}</span>
                          <span className="bg-forest-50 px-2 py-0.5 rounded text-forest-500">
                            MC {pack.minecraftVersion}
                          </span>
                          {pack.mods.length > 0 && (
                            <span className="bg-forest-50 px-2 py-0.5 rounded text-forest-500">
                              {pack.mods.length}개 모드
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="ml-6 flex items-center gap-2">
                        {pack.installed ? (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="bg-forest-50 border border-forest-100 hover:bg-forest-100 font-bold"
                            >
                              {t('mods.update')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-500 hover:bg-red-50 font-bold"
                            >
                              {t('mods.remove')}
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => installModPack(pack.id)}
                            className="bg-fairy-500 hover:bg-fairy-600 font-bold shadow-sm"
                          >
                            {t('mods.install')}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* 포함된 모드 미리보기 */}
                    {pack.installed && pack.mods.length > 0 && (
                      <div className="mt-5 pt-5 border-t border-forest-50">
                        <p className="text-xs text-forest-400 mb-2 font-bold uppercase tracking-wider">
                          {t('mods.includedMods')}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {pack.mods.slice(0, 5).map((mod) => (
                            <span
                              key={mod.id}
                              className="px-2.5 py-1 bg-white border border-forest-100 rounded text-xs text-forest-500 font-medium"
                            >
                              {mod.name}
                            </span>
                          ))}
                          {pack.mods.length > 5 && (
                            <span className="px-2.5 py-1 bg-forest-50 text-forest-400 rounded text-xs font-medium">
                              {t('mods.more', { count: pack.mods.length - 5 })}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* 개별 모드 목록 */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
              {mods.map((mod) => (
                <Card
                  key={mod.id}
                  className="border border-forest-100 bg-white hover:border-fairy-200 hover:shadow-md transition-all bg-white"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-forest-800">{mod.name}</h3>
                          <span className="text-xs px-2 py-0.5 rounded bg-forest-50 text-forest-500 font-bold font-mono">
                            v{mod.version}
                          </span>
                        </div>
                        <p className="text-sm text-forest-500 mb-3 line-clamp-1 font-medium">{mod.description}</p>
                        <div className="flex items-center gap-3 text-xs text-forest-400 font-medium">
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            {mod.author}
                          </span>
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
                        </div>
                      </div>

                      {/* 토글 스위치 (숲 테마) */}
                      <button
                        onClick={() => toggleMod(mod.id)}
                        className={cn(
                          'relative w-11 h-6 rounded-full transition-colors flex-shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fairy-400',
                          mod.enabled ? 'bg-fairy-500' : 'bg-forest-100'
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

          {/* 푸터 */}
          <Footer />
        </div>
      </div>

      {/* 알림 모달 */}
      <AlertModal isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)} message={alertMessage} />
    </div>
  )
}
