import { useTranslation } from 'react-i18next'

import { Seo } from '../components/common/Seo'
import { useSiteContent } from '../hooks/useSiteContent'
import { getLocale } from '../utils/locale'

export function CookiesPage() {
  const { content } = useSiteContent()
  const { t, i18n } = useTranslation()
  const locale = getLocale(i18n.language)

  return (
    <>
      <Seo settings={content.seo.cookies} locale={locale} />
      <section className="bg-[var(--color-paper)] px-5 pb-20 pt-36 sm:px-8 lg:px-10 lg:pb-[120px]">
        <div className="mx-auto max-w-3xl rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)] sm:p-8">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-brass)]">
            Gerka Pool House
          </p>
          <h1 className="text-4xl font-semibold text-[var(--color-ink)]">{t('legal.cookiesTitle')}</h1>
          <p className="mt-6 text-lg leading-8 text-[var(--color-muted)]">{t('legal.cookiesBody')}</p>
        </div>
      </section>
    </>
  )
}
