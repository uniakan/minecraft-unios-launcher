import { useState, useEffect } from 'react'
import { cn } from '@shared/lib'
import { useTranslation } from '@shared/i18n'

export function TitleBar() {
  const { language, setLanguage } = useTranslation()
  const [platform, setPlatform] = useState<string>('')
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.electronAPI?.app.getPlatform().then(setPlatform)
  }, [])

  const handleMinimize = () => {
    window.electronAPI?.window.minimize()
  }

  const handleMaximize = () => {
    window.electronAPI?.window.maximize()
    setIsMaximized(!isMaximized)
  }

  const handleClose = () => {
    window.electronAPI?.window.close()
  }

  return (
    <div className="h-12 flex items-center justify-between px-5 bg-white/60 backdrop-blur-md border-b border-white/40 select-none drag-region z-50">
      {/* 로고 & 타이틀 */}
      <div className="flex items-center gap-3">
        <img src="./icon.png" alt="UniOS Launcher" className="w-6 h-6 drop-shadow-sm select-none" />
        <span className="text-base font-bold text-forest-800 tracking-wide font-sans">Unios Minecraft</span>
      </div>

      {/* 우측 컨트롤 영역 */}
      <div className="flex items-center gap-4 no-drag">
        {/* 언어 변경 버튼 (지구본 아이콘) */}
        <button
          onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
          className="p-1.5 rounded-lg text-forest-500 hover:text-forest-800 hover:bg-forest-50/50 transition-all active:scale-95 mr-1 focus:outline-none"
          title={language === 'ko' ? 'Switch to English' : '한국어로 변경'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

        {/* 윈도우 컨트롤 버튼 (크기 확대됨: w-4 h-4) */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleMinimize}
            className="w-4 h-4 rounded-full bg-yellow-400 hover:bg-yellow-500 transition-colors shadow-sm focus:outline-none group flex items-center justify-center opacity-90 hover:opacity-100"
            title="최소화"
          >
            <svg
              className="w-2.5 h-2.5 text-yellow-900 opacity-0 group-hover:opacity-100 transition-opacity"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={handleMaximize}
            className="w-4 h-4 rounded-full bg-fairy-500 hover:bg-fairy-600 transition-colors shadow-sm focus:outline-none group flex items-center justify-center opacity-90 hover:opacity-100"
            title="최대화"
          >
            <svg
              className="w-2.5 h-2.5 text-fairy-900 opacity-0 group-hover:opacity-100 transition-opacity"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={handleClose}
            className="w-4 h-4 rounded-full bg-red-400 hover:bg-red-500 transition-colors shadow-sm focus:outline-none group flex items-center justify-center opacity-90 hover:opacity-100"
            title="닫기"
          >
            <svg
              className="w-2.5 h-2.5 text-red-900 opacity-0 group-hover:opacity-100 transition-opacity"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
