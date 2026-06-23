import { useTranslation } from 'react-i18next'

import { FeatureIcon } from '../components/common/Icon'
import { SectionHeading } from '../components/ui/SectionHeading'
import type { Locale } from '../types/common'
import type { FeatureItem } from '../types/content'
import { localize } from '../utils/locale'

export function AmenitiesSection({ items, locale }: { items: FeatureItem[]; locale: Locale }) {
  const { t } = useTranslation()

  return (
    <section id="amenities" className="bg-[var(--color-paper)] px-5 py-20 sm:px-8 lg:px-10 lg:py-[120px]">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow={t('sections.amenitiesEyebrow')}
          title={t('sections.amenitiesTitle')}
          lead={t('sections.amenitiesLead')}
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-1.5 hover:border-[var(--color-brass)] hover:bg-[var(--color-surface-2)] hover:shadow-[var(--shadow-premium)]"
            >
              <div className="mb-5 grid size-11 place-items-center rounded-xl bg-[rgba(214,181,138,0.14)] text-[var(--color-brass)]">
                <FeatureIcon icon={item.icon} />
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-ink)]">{localize(item.title, locale)}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{localize(item.description, locale)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
