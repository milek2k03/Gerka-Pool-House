import { motion } from 'framer-motion'
import { UsersRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { FeatureIcon } from '../components/common/Icon'
import { SectionHeading } from '../components/ui/SectionHeading'
import type { Locale } from '../types/common'
import type { SiteContent } from '../types/content'
import { localize } from '../utils/locale'

export function AboutSection({ content, locale }: { content: SiteContent; locale: Locale }) {
  const { t } = useTranslation()

  return (
    <section id="about" className="bg-[var(--color-paper)] px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <SectionHeading
          eyebrow={t('sections.aboutEyebrow')}
          title={localize(content.about.title, locale)}
          lead={localize(content.about.lead, locale)}
        />
        <div className="space-y-8">
          <p className="text-lg leading-8 text-[var(--color-muted)]">{localize(content.about.body, locale)}</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {content.about.highlights.map((item, index) => (
              <motion.article
                key={item.id}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: index * 0.08 }}
              >
                <div className="mb-4 grid size-10 place-items-center rounded-md bg-[var(--color-sage)] text-white">
                  <FeatureIcon icon={item.icon} />
                </div>
                <h3 className="text-base font-semibold text-[var(--color-ink)]">{localize(item.title, locale)}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{localize(item.description, locale)}</p>
              </motion.article>
            ))}
          </div>
          <div className="flex items-center gap-3 rounded-md bg-[var(--color-surface)] p-5 text-white">
            <UsersRound aria-hidden="true" className="size-6 shrink-0 text-[var(--color-brass)]" />
            <p className="text-sm leading-6 text-white/78">
              {t('pricing.room1')}: {t('pricing.upToGuests', { count: content.pricing.room1Capacity })}.{' '}
              {t('pricing.room2')}: {t('pricing.activatedAbove', { count: content.pricing.room1Capacity })}.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
