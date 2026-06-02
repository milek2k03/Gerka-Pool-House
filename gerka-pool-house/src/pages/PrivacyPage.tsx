import { useTranslation } from 'react-i18next'

import { Seo } from '../components/common/Seo'
import { useSiteContent } from '../hooks/useSiteContent'
import { getLocale } from '../utils/locale'

export function PrivacyPage() {
  const { content } = useSiteContent()
  const { t, i18n } = useTranslation()
  const locale = getLocale(i18n.language)

  return (
    <>
      <Seo settings={content.seo.privacy} locale={locale} />
      <section className="bg-[var(--color-paper)] px-5 pb-20 pt-36 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-clay)]">
            Gerka Pool House
          </p>
          <h1 className="text-4xl font-semibold text-[var(--color-ink)]">{t('legal.privacyTitle')}</h1>
          <p className="mt-6 text-lg leading-8 text-[var(--color-muted)]">{t('legal.privacyBody')}</p>
        </div>
      </section>
    </>
  )
}
