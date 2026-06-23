import { BusFront, ExternalLink, PlaneLanding, Route, ShoppingBasket, Utensils } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { FeatureIcon } from '../components/common/Icon'
import { ResponsiveImage } from '../components/common/ResponsiveImage'
import { SectionHeading } from '../components/ui/SectionHeading'
import type { Locale } from '../types/common'
import type { AreaInfoItem, AreaItem, SiteContent } from '../types/content'
import { cn } from '../utils/cn'
import { localize } from '../utils/locale'

function InfoCard({
  item,
  locale,
  compact = false,
}: {
  item: AreaInfoItem
  locale: Locale
  compact?: boolean
}) {
  return (
    <article
      className={cn(
        'rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-1.5 hover:border-[var(--color-brass)] hover:bg-[var(--color-surface-2)] hover:shadow-[var(--shadow-premium)]',
        compact ? 'p-4' : 'p-5',
      )}
    >
      <p className={cn('font-semibold uppercase tracking-[0.12em] text-[var(--color-brass)]', compact ? 'text-[0.68rem]' : 'text-xs')}>
        {localize(item.distance, locale)}
      </p>
      <h3 className={cn('font-semibold text-[var(--color-ink)]', compact ? 'mt-2 text-base' : 'mt-3 text-lg')}>
        {localize(item.title, locale)}
      </h3>
      <p className={cn('text-sm text-[var(--color-muted)]', compact ? 'mt-2 leading-5' : 'mt-3 leading-6')}>
        {localize(item.description, locale)}
      </p>
      {item.details?.length ? (
        <ul className={cn('flex flex-wrap gap-2', compact ? 'mt-3' : 'mt-4')}>
          {item.details.map((detail) => (
            <li
              key={localize(detail, locale)}
              className={cn(
                'rounded-full bg-[rgba(214,181,138,0.12)] font-semibold text-[var(--color-brass)]',
                compact ? 'px-2.5 py-1 text-[0.68rem]' : 'px-3 py-1.5 text-xs',
              )}
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
          className={cn(
            'inline-flex items-center gap-2 rounded-full border border-[rgba(214,181,138,0.35)] font-semibold text-[var(--color-brass)] transition hover:border-[var(--color-brass)] hover:bg-[rgba(214,181,138,0.12)] hover:text-[var(--color-brass-hover)]',
            compact ? 'mt-4 px-3 py-2 text-xs' : 'mt-5 px-4 py-2 text-sm',
          )}
        >
          {localize(item.link.label, locale)}
          <ExternalLink aria-hidden="true" className={compact ? 'size-3.5' : 'size-4'} />
        </a>
      ) : null}
    </article>
  )
}

function PlaceCard({ item, locale }: { item: AreaItem; locale: Locale }) {
  return (
    <article
      className="grid gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-1.5 hover:border-[var(--color-brass)] hover:bg-[var(--color-surface-2)] hover:shadow-[var(--shadow-premium)] sm:grid-cols-[auto_1fr]"
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
    </article>
  )
}

export function AreaSection({ content, locale }: { content: SiteContent; locale: Locale }) {
  const { t } = useTranslation()
  const busRoutes = content.area.busRoutes ?? []
  const airports = content.area.airports ?? []

  return (
    <section id="area" className="section-spacing bg-[var(--color-deep)] px-5 sm:px-8 lg:px-10">
      <div className="section-stack mx-auto grid max-w-7xl">
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
              {content.area.restaurants.map((item) => (
                <InfoCard key={item.id} item={item} locale={locale} />
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
              {content.area.nearby.map((item) => (
                <InfoCard key={item.id} item={item} locale={locale} />
              ))}
            </div>
          </div>

          {busRoutes.length > 0 ? (
            <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-paper-2)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
              <div className="flex items-center gap-3 text-[var(--color-brass)]">
                <BusFront aria-hidden="true" className="size-5" />
                <h2 className="text-2xl font-semibold text-[var(--color-ink)]">{t('sections.busAccessTitle')}</h2>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
                {t('sections.busAccessLead')}
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {busRoutes.map((item) => (
                  <InfoCard key={item.id} item={item} locale={locale} compact />
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
                {airports.map((item) => (
                  <InfoCard key={item.id} item={item} locale={locale} />
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
            {content.area.items.map((item) => (
              <PlaceCard key={item.id} item={item} locale={locale} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
