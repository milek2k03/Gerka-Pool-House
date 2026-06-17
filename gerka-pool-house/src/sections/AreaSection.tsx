import { motion } from 'framer-motion'
import { BusFront, ExternalLink, PlaneLanding, Route, ShoppingBasket, Utensils } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { FeatureIcon } from '../components/common/Icon'
import { ResponsiveImage } from '../components/common/ResponsiveImage'
import { SectionHeading } from '../components/ui/SectionHeading'
import type { Locale } from '../types/common'
import type { AreaInfoItem, AreaItem, SiteContent } from '../types/content'
import { localize } from '../utils/locale'

function InfoCard({
  item,
  locale,
  index,
}: {
  item: AreaInfoItem
  locale: Locale
  index: number
}) {
  return (
    <motion.article
      className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-1.5 hover:border-[var(--color-brass)] hover:bg-[var(--color-surface-2)] hover:shadow-[var(--shadow-premium)]"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ delay: index * 0.05 }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-brass)]">
        {localize(item.distance, locale)}
      </p>
      <h3 className="mt-3 text-lg font-semibold text-[var(--color-ink)]">{localize(item.title, locale)}</h3>
      <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{localize(item.description, locale)}</p>
      {item.details?.length ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {item.details.map((detail) => (
            <li
              key={localize(detail, locale)}
              className="rounded-full bg-[rgba(214,181,138,0.12)] px-3 py-1.5 text-xs font-semibold text-[var(--color-brass)]"
            >
              {localize(detail, locale)}
            </li>
          ))}
        </ul>
      ) : null}
      {item.link?.href ? (
        <a
          href={item.link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-[rgba(214,181,138,0.35)] px-4 py-2 text-sm font-semibold text-[var(--color-brass)] transition hover:border-[var(--color-brass)] hover:bg-[rgba(214,181,138,0.12)] hover:text-[var(--color-brass-hover)]"
        >
          {localize(item.link.label, locale)}
          <ExternalLink aria-hidden="true" className="size-4" />
        </a>
      ) : null}
    </motion.article>
  )
}

function PlaceCard({ item, locale, index }: { item: AreaItem; locale: Locale; index: number }) {
  return (
    <motion.article
      className="grid gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-1.5 hover:border-[var(--color-brass)] hover:bg-[var(--color-surface-2)] hover:shadow-[var(--shadow-premium)] sm:grid-cols-[auto_1fr]"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="grid size-11 place-items-center rounded-xl bg-[rgba(214,181,138,0.14)] text-[var(--color-brass)]">
        <FeatureIcon icon={item.icon} />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-brass)]">
          {localize(item.distance, locale)}
        </p>
        <h3 className="mt-2 text-lg font-semibold text-[var(--color-ink)]">{localize(item.title, locale)}</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{localize(item.description, locale)}</p>
      </div>
    </motion.article>
  )
}

export function AreaSection({ content, locale }: { content: SiteContent; locale: Locale }) {
  const { t } = useTranslation()
  const busRoutes = content.area.busRoutes ?? []
  const airports = content.area.airports ?? []

  return (
    <section id="area" className="bg-[var(--color-deep)] px-5 py-20 sm:px-8 lg:px-10 lg:py-[120px]">
      <div className="mx-auto grid max-w-7xl gap-12">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <SectionHeading
              eyebrow={t('sections.areaEyebrow')}
              title={localize(content.area.title, locale)}
              lead={localize(content.area.lead, locale)}
            />
            <ResponsiveImage
              image={content.area.image}
              alt={localize(content.area.title, locale)}
              className="mt-8 aspect-[4/3] rounded-[var(--radius-card)] shadow-[var(--shadow-soft)]"
              sizes="(min-width: 1024px) 42vw, 100vw"
            />
          </div>
          <div className="grid gap-4">
            <div className="flex items-center gap-3 text-[var(--color-brass)]">
              <Utensils aria-hidden="true" className="size-5" />
              <h2 className="text-2xl font-semibold text-[var(--color-ink)]">{t('sections.restaurantsTitle')}</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {content.area.restaurants.map((item, index) => (
                <InfoCard key={item.id} item={item} locale={locale} index={index} />
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-8">
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-paper-2)] p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-3 text-[var(--color-brass)]">
              <ShoppingBasket aria-hidden="true" className="size-5" />
              <h2 className="text-2xl font-semibold text-[var(--color-ink)]">{t('sections.nearbyTitle')}</h2>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {content.area.nearby.map((item, index) => (
                <InfoCard key={item.id} item={item} locale={locale} index={index} />
              ))}
            </div>
          </div>

          {busRoutes.length > 0 ? (
            <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-paper-2)] p-6 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-3 text-[var(--color-brass)]">
                <BusFront aria-hidden="true" className="size-5" />
                <h2 className="text-2xl font-semibold text-[var(--color-ink)]">{t('sections.busAccessTitle')}</h2>
              </div>
              <p className="mt-4 max-w-4xl text-sm leading-6 text-[var(--color-muted)]">
                {t('sections.busAccessLead')}
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {busRoutes.map((item, index) => (
                  <InfoCard key={item.id} item={item} locale={locale} index={index} />
                ))}
              </div>
            </div>
          ) : null}

          {airports.length > 0 ? (
            <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-paper-2)] p-6 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-3 text-[var(--color-brass)]">
                <PlaneLanding aria-hidden="true" className="size-5" />
                <h2 className="text-2xl font-semibold text-[var(--color-ink)]">{t('sections.airportsTitle')}</h2>
              </div>
              <p className="mt-4 max-w-4xl text-sm leading-6 text-[var(--color-muted)]">
                {t('sections.airportsLead')}
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {airports.map((item, index) => (
                  <InfoCard key={item.id} item={item} locale={locale} index={index} />
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-paper-2)] p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-3 text-[var(--color-brass)]">
              <Route aria-hidden="true" className="size-5" />
              <h2 className="text-2xl font-semibold text-[var(--color-ink)]">
                {localize(content.area.bikeRoutes.title, locale)}
              </h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--color-muted)]">
              {localize(content.area.bikeRoutes.lead, locale)}
            </p>
            <ul className="mt-6 grid gap-3 md:grid-cols-3">
              {content.area.bikeRoutes.routes.map((route) => (
                <li
                  key={localize(route, locale)}
                  className="rounded-[1.1rem] bg-[var(--color-surface)] p-4 text-sm font-semibold leading-6 text-[var(--color-ink)]"
                >
                  {localize(route, locale)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid gap-5">
          <SectionHeading
            eyebrow={t('sections.placesEyebrow')}
            title={t('sections.placesTitle')}
            lead={t('sections.placesLead')}
          />
          <div className="grid gap-4 md:grid-cols-2">
            {content.area.items.map((item, index) => (
              <PlaceCard key={item.id} item={item} locale={locale} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
