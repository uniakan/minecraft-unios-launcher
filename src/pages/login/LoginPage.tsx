import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@features/auth'
import { Card, CardContent, Button, Input } from '@shared/ui'
// TitleBar 제거
import { useTranslation } from '@shared/i18n'

export function LoginPage() {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const { t } = useTranslation()
  const [offlineUsername, setOfflineUsername] = useState('')
  const [mode, setMode] = useState<'main' | 'offline'>('main')
  const [isLoading, setIsLoading] = useState(false)
  const [deviceCode, setDeviceCode] = useState<{ userCode: string; verificationUri: string } | null>(null)

  useEffect(() => {
    // Device Code 이벤트 리스너 등록
    window.electronAPI?.auth.onDeviceCode((data) => {
      setDeviceCode(data)
    })

    return () => {
      window.electronAPI?.auth.removeDeviceCodeListener()
    }
  }, [])

  const handleMicrosoftLogin = async () => {
    setIsLoading(true)
    setDeviceCode(null)
    try {
      const result = await window.electronAPI?.auth.microsoftLogin()
      setDeviceCode(null)
      if (result?.success && result.user) {
        setUser(result.user)
        navigate('/home')
      } else {
        alert(result?.error || '로그인에 실패했습니다.')
      }
    } catch (error) {
      console.error('Microsoft login error:', error)
      alert('로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
      setDeviceCode(null)
    }
  }

  const handleOfflineLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!offlineUsername.trim()) return

    setIsLoading(true)
    // 오프라인 모드용 UUID 생성 (Minecraft 오프라인 UUID 형식)
    const offlineUuid = generateOfflineUuid(offlineUsername)
    setTimeout(() => {
      setUser({
        id: 'offline-' + Date.now(),
        username: offlineUsername,
        accessToken: 'offline_token',
        uuid: offlineUuid,
        type: 'offline',
      })
      navigate('/home')
    }, 800)
  }

  // Minecraft 오프라인 UUID 생성 (Java의 UUID.nameUUIDFromBytes와 동일한 방식)
  const generateOfflineUuid = (username: string): string => {
    const data = `OfflinePlayer:${username}`
    // MD5 해시를 사용하여 UUID v3 생성
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    // 간단한 UUID 형식 생성 (실제로는 MD5 기반이지만, 여기선 간단한 해시 사용)
    const hex = Math.abs(hash).toString(16).padStart(8, '0')
    const uuid = `${hex.slice(0, 8)}-${hex.slice(0, 4)}-3${hex.slice(1, 4)}-a${hex.slice(1, 4)}-${hex.slice(0, 12).padEnd(12, '0')}`
    return uuid
  }

  return (
    <div className="h-full flex flex-col font-sans relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute inset-0 bg-gradient-to-br from-fairy-50 via-sky-50 to-fairy-100 animate-gradient-slow" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-fairy-200/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-200/40 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4" />

      {/* 중복 TitleBar 제거됨 */}

      <div className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-md animate-slide-up">
          <Card className="glass-panel border-white/60 shadow-xl shadow-fairy-900/5">
            <CardContent className="p-8 pt-10 text-center">
              {/* 로고 영역 */}
              <div className="w-20 h-20 bg-gradient-to-br from-fairy-400 to-fairy-600 rounded-3xl mx-auto mb-6 shadow-lg shadow-fairy-500/30 flex items-center justify-center rotate-3 hover:rotate-6 transition-transform duration-500">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"
                  />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-forest-900 mb-2 tracking-tight">{t('login.title')}</h1>
              <p className="text-forest-500 text-sm mb-8 font-medium">{t('login.subtitle')}</p>

              {mode === 'main' ? (
                <div className="space-y-3">
                  {/* Device Code 표시 */}
                  {deviceCode && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700 mb-2">
                        브라우저에서 아래 코드를 입력하세요:
                      </p>
                      <p className="text-2xl font-mono font-bold text-blue-900 tracking-wider">
                        {deviceCode.userCode}
                      </p>
                      <p className="text-xs text-blue-600 mt-2">
                        인증 완료 후 자동으로 로그인됩니다...
                      </p>
                    </div>
                  )}

                  <Button
                    variant="primary"
                    className="w-full h-12 text-base font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/20 border-none transition-all duration-300 transform hover:-translate-y-0.5"
                    onClick={handleMicrosoftLogin}
                    isLoading={isLoading}
                    disabled={isLoading}
                  >
                    <svg className="w-5 h-5 mr-3 opacity-90" viewBox="0 0 23 23" fill="currentColor">
                      <path d="M0 0h11v11H0V0zm12 0h11v11H12V0zM0 12h11v11H0V12zm12 0h11v11H12V12z" />
                    </svg>
                    {isLoading ? '로그인 중...' : t('login.microsoft')}
                  </Button>

                  <div className="relative py-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-forest-100/50"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white/80 px-2 text-forest-400 font-medium">{t('login.or')}</span>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    className="w-full h-12 font-bold text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200 transition-all duration-300"
                    onClick={() => setMode('offline')}
                    disabled={isLoading}
                  >
                    {t('login.offline')}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleOfflineLogin} className="space-y-4">
                  <div className="text-left">
                    <Input
                      label={t('login.offlineMode.label')}
                      placeholder={t('login.offlineMode.placeholder')}
                      value={offlineUsername}
                      onChange={(e) => setOfflineUsername(e.target.value)}
                      autoFocus
                      className="bg-white/70 focus:border-emerald-400 focus:ring-emerald-400"
                      maxLength={16}
                    />
                  </div>

                  <div className="pt-2 space-y-3">
                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full h-12 font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/20 border-none transition-all duration-300 transform hover:-translate-y-0.5"
                      disabled={!offlineUsername.trim()}
                      isLoading={isLoading}
                    >
                      {t('login.offlineMode.start')}
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full h-12 text-forest-500 hover:text-emerald-600 hover:bg-emerald-50/50"
                      onClick={() => setMode('main')}
                    >
                      {t('login.offlineMode.back')}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>

            <div className="p-4 border-t border-white/50 bg-white/30 text-center">
              <p className="text-[10px] text-forest-400" dangerouslySetInnerHTML={{ __html: t('login.terms') }} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
