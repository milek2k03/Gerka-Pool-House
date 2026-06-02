import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

import { FeatureIcon } from '../components/common/Icon'
import { SectionHeading } from '../components/ui/SectionHeading'
import type { Locale } from '../types/common'
import type { FeatureItem } from '../types/content'
import { localize } from '../utils/locale'

export function AmenitiesSection({ items, locale }: { items: FeatureItem[]; locale: Locale }) {
  const { t } = useTranslation()

  return (
    <section id="amenities" className="bg-[var(--color-paper)] px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow={t('sections.amenitiesEyebrow')}
          title={t('sections.amenitiesTitle')}
          lead={t('sections.amenitiesLead')}
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <motion.article
              key={item.id}
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="mb-5 grid size-11 place-items-center rounded-md bg-[var(--color-water)] text-white">
                <FeatureIcon icon={item.icon} />
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-ink)]">{localize(item.title, locale)}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{localize(item.description, locale)}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
