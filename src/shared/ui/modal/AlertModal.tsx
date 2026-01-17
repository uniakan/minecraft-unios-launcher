import { Modal } from './Modal'
import { Button } from '../button/Button'
import { useTranslation } from '@shared/i18n'

interface AlertModalProps {
  isOpen: boolean
  onClose: () => void
  message: string
}

export function AlertModal({ isOpen, onClose, message }: AlertModalProps) {
  const { t } = useTranslation()

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-sm">
      <div className="flex flex-col items-center text-center">
        {/* 헤더 아이콘 */}
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-4 shadow-sm">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* 타이틀 */}
        <h3 className="text-xl font-bold text-forest-900 mb-4">{t('common.alert')}</h3>

        {/* 메시지 */}
        <div className="w-full px-2 mb-6">
          <p className="text-forest-600 font-medium break-all whitespace-pre-wrap text-sm leading-relaxed p-3 bg-forest-50/50 rounded-xl border border-forest-50">
            {message}
          </p>
        </div>

        {/* 닫기 버튼: 캡처된 이미지와 유사한 짙은 쑥색 */}
        <Button
          variant="primary"
          onClick={onClose}
          className="w-full bg-[#3F524C] hover:bg-[#2E3D39] text-white font-bold shadow-md shadow-gray-200 transition-colors py-3"
        >
          {t('common.confirm')}
        </Button>
      </div>
    </Modal>
  )
}
