import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@shared/lib'
import { useAuthStore } from '@features/auth'
import { Button } from '@shared/ui'
import { useTranslation } from '@shared/i18n'

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { t } = useTranslation()

  const navItems = [
    { path: '/home', label: t('sidebar.home'), icon: HomeIcon },
    { path: '/versions', label: t('sidebar.versions'), icon: VersionsIcon },
    { path: '/mods', label: t('sidebar.mods'), icon: ModsIcon },
    { path: '/settings', label: t('sidebar.settings'), icon: SettingsIcon },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="w-64 h-full flex flex-col glass-panel border-r border-white/40 bg-white/40 backdrop-blur-xl transition-all duration-300">
      {/* 사용자 프로필 - 상단 고정 */}
      <div className="p-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fairy-300 to-fairy-500 shadow-lg shadow-fairy-500/20 flex items-center justify-center text-white font-bold text-xl ring-2 ring-white/50">
            {user?.username?.[0]?.toUpperCase() || 'G'}
          </div>
          <div className="flex-1 overflow-hidden">
            <h3 className="font-bold text-forest-900 truncate tracking-tight">{user?.username || 'Guest'}</h3>
            <p className="text-xs text-forest-500 font-medium">{t('sidebar.account')}</p>
          </div>
        </div>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group',
                isActive
                  ? 'bg-white/80 text-fairy-600 shadow-sm ring-1 ring-white/60'
                  : 'text-forest-600 hover:bg-white/40 hover:text-forest-900'
              )}
            >
              <item.icon
                className={cn(
                  'w-5 h-5 transition-colors',
                  isActive ? 'text-fairy-500' : 'text-forest-400 group-hover:text-forest-600'
                )}
              />
              <span className="font-medium">{item.label}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-fairy-500 shadow-glow" />}
            </Link>
          )
        })}
      </nav>

      {/* 하단 - 서버 상태 및 로그아웃 */}
      <div className="p-4 mt-auto space-y-4">
        <div className="px-4 py-3 rounded-xl bg-fairy-50/50 border border-fairy-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-green" />
            <span className="text-xs font-medium text-forest-600">{t('sidebar.serverStatus')}</span>
          </div>
          <span className="text-xs font-bold text-fairy-600">{t('sidebar.playing', { count: 128 })}</span>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-forest-500 hover:text-red-500 hover:bg-red-50/50 rounded-xl transition-all duration-300 text-sm font-medium"
        >
          <LogoutIcon className="w-5 h-5" />
          {t('sidebar.logout')}
        </button>
      </div>
    </div>
  )
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  )
}

function VersionsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    </svg>
  )
}

function ModsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"
      />
    </svg>
  )
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  )
}
