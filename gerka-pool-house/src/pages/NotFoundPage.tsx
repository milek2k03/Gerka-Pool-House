import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ButtonLink } from '../components/ui/Button'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <section className="grid min-h-[70svh] place-items-center bg-[var(--color-paper)] px-5 pt-28">
      <div className="max-w-xl rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-[var(--shadow-soft)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-brass)]">404</p>
        <h1 className="mt-3 text-4xl font-semibold text-[var(--color-ink)]">{t('notFound.title')}</h1>
        <p className="mt-4 text-lg text-[var(--color-muted)]">{t('notFound.body')}</p>
        <ButtonLink to="/" className="mt-8">
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t('notFound.backHome')}
        </ButtonLink>
      </div>
    </section>
  )
}
