import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

import { FeatureIcon } from '../components/common/Icon'
import { ResponsiveImage } from '../components/common/ResponsiveImage'
import { SectionHeading } from '../components/ui/SectionHeading'
import type { Locale } from '../types/common'
import type { SiteContent } from '../types/content'
import { localize } from '../utils/locale'

export function AreaSection({ content, locale }: { content: SiteContent; locale: Locale }) {
  const { t } = useTranslation()

  return (
    <section id="area" className="bg-[var(--color-deep)] px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <SectionHeading
            eyebrow={t('sections.areaEyebrow')}
            title={localize(content.area.title, locale)}
            lead={localize(content.area.lead, locale)}
          />
          <ResponsiveImage
            image={content.area.image}
            alt={localize(content.gallery.find((item) => item.id === 'nearby-lake')?.alt ?? { pl: '', en: '' }, locale)}
            className="mt-8 aspect-[4/3] rounded-md"
            sizes="(min-width: 1024px) 42vw, 100vw"
          />
        </div>
        <div className="grid gap-4">
          {content.area.items.map((item, index) => (
            <motion.article
              key={item.id}
              className="grid gap-4 rounded-md border border-[var(--color-border)] bg-[var(--color-paper)] p-5 sm:grid-cols-[auto_1fr_auto] sm:items-start"
              initial={{ opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: index * 0.06 }}
            >
              <div className="grid size-11 place-items-center rounded-md bg-[var(--color-surface)] text-[var(--color-sage)]">
                <FeatureIcon icon={item.icon} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-ink)]">{localize(item.title, locale)}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{localize(item.description, locale)}</p>
              </div>
              <p className="rounded-md bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-sage)]">
                {localize(item.distance, locale)}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
