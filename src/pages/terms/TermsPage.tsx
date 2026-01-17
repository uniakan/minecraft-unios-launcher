import { useNavigate } from 'react-router-dom'
import { Card, CardContent, Button } from '@shared/ui'
import { useTranslation } from '@shared/i18n'

export function TermsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="h-full flex flex-col font-sans relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute inset-0 bg-gradient-to-br from-fairy-50 via-sky-50 to-fairy-100" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-fairy-200/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-200/40 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4" />

      <div className="flex-1 flex items-start justify-center p-6 z-10 overflow-auto">
        <div className="w-full max-w-3xl animate-slide-up py-4">
          <Card className="glass-panel border-white/60 shadow-xl shadow-fairy-900/5">
            <CardContent className="p-8">
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-forest-100">
                <h1 className="text-2xl font-bold text-forest-900">{t('terms.title')}</h1>
                <Button variant="ghost" onClick={() => navigate(-1)} className="text-forest-500 hover:text-forest-700">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  {t('terms.back')}
                </Button>
              </div>

              {/* 본문 */}
              <div className="prose prose-forest max-w-none text-forest-700 space-y-6">
                <p className="text-sm text-forest-400">{t('terms.lastUpdated')}: 2026년 1월 18일</p>

                <section>
                  <h2 className="text-lg font-bold text-forest-800 mb-3">{t('terms.section1.title')}</h2>
                  <p className="text-sm leading-relaxed">{t('terms.section1.content')}</p>
                </section>

                <section>
                  <h2 className="text-lg font-bold text-forest-800 mb-3">{t('terms.section2.title')}</h2>
                  <p className="text-sm leading-relaxed">{t('terms.section2.content')}</p>
                </section>

                <section>
                  <h2 className="text-lg font-bold text-forest-800 mb-3">{t('terms.section3.title')}</h2>
                  <p className="text-sm leading-relaxed">{t('terms.section3.content')}</p>
                </section>

                <section>
                  <h2 className="text-lg font-bold text-forest-800 mb-3">{t('terms.section4.title')}</h2>
                  <p className="text-sm leading-relaxed">{t('terms.section4.content')}</p>
                </section>

                <section>
                  <h2 className="text-lg font-bold text-forest-800 mb-3">{t('terms.section5.title')}</h2>
                  <p className="text-sm leading-relaxed">{t('terms.section5.content')}</p>
                </section>

                <section>
                  <h2 className="text-lg font-bold text-forest-800 mb-3">{t('terms.section6.title')}</h2>
                  <p className="text-sm leading-relaxed">{t('terms.section6.content')}</p>
                </section>

                <section>
                  <h2 className="text-lg font-bold text-forest-800 mb-3">{t('terms.section7.title')}</h2>
                  <p className="text-sm leading-relaxed">{t('terms.section7.content')}</p>
                </section>
              </div>

              {/* 동의 버튼 */}
              <div className="mt-8 pt-6 border-t border-forest-100">
                <Button
                  variant="primary"
                  onClick={() => navigate(-1)}
                  className="w-full h-12 font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/20 border-none"
                >
                  {t('terms.understood')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
