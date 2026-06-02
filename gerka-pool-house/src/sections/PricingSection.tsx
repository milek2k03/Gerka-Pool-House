import { Calculator, UsersRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { SectionHeading } from '../components/ui/SectionHeading'
import type { Locale } from '../types/common'
import type { PriceSettings } from '../types/content'
import { formatMoney } from '../utils/format'
import { localize } from '../utils/locale'

export function PricingSection({ pricing, locale }: { pricing: PriceSettings; locale: Locale }) {
  const { t } = useTranslation()
  const room1 = formatMoney(pricing.room1Nightly, locale, pricing.currency)
  const bothRooms = formatMoney(pricing.room1Nightly + pricing.room2Nightly, locale, pricing.currency)

  return (
    <section id="pricing" className="bg-[var(--color-paper)] px-5 py-20 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow={t('sections.pricingEyebrow')}
          title={t('sections.pricingTitle')}
          lead={t('sections.pricingLead')}
          tone="dark"
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-md border border-white/14 bg-white/8">
            <table className="w-full min-w-[620px] text-left">
              <caption className="sr-only">{t('sections.pricingTitle')}</caption>
              <thead className="bg-white/12 text-sm text-white/78">
                <tr>
                  <th className="px-5 py-4 font-semibold">{t('pricing.room')}</th>
                  <th className="px-5 py-4 font-semibold">{t('pricing.capacity')}</th>
                  <th className="px-5 py-4 font-semibold">{t('pricing.priceNight')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-white">
                <tr>
                  <td className="px-5 py-5">
                    <span className="font-semibold">{t('pricing.room1')}</span>
                    <span className="ml-2 text-sm text-white/58">{t('pricing.baseRoom')}</span>
                  </td>
                  <td className="px-5 py-5">{t('pricing.upToGuests', { count: pricing.room1Capacity })}</td>
                  <td className="px-5 py-5 text-lg font-semibold">{room1}</td>
                </tr>
                <tr>
                  <td className="px-5 py-5">
                    <span className="font-semibold">{t('pricing.room2')}</span>
                    <span className="ml-2 text-sm text-white/58">{t('pricing.extraRoom')}</span>
                  </td>
                  <td className="px-5 py-5">{t('pricing.activatedAbove', { count: pricing.room1Capacity })}</td>
                  <td className="px-5 py-5 text-lg font-semibold">
                    {formatMoney(pricing.room2Nightly, locale, pricing.currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <aside className="rounded-md border border-white/14 bg-white/8 p-6">
            <div className="grid size-12 place-items-center rounded-md bg-[var(--color-brass)] text-[var(--color-deep)]">
              <Calculator aria-hidden="true" className="size-6" />
            </div>
            <h3 className="mt-5 text-xl font-semibold">{t('pricing.exampleTitle')}</h3>
            <dl className="mt-5 grid gap-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-white/68">{t('pricing.people', { count: 4 })}</dt>
                <dd className="font-semibold">{t('pricing.perNight', { price: room1 })}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-white/68">{t('pricing.people', { count: 8 })}</dt>
                <dd className="font-semibold">{t('pricing.perNight', { price: bothRooms })}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-white/68">{t('pricing.people', { count: 12 })}</dt>
                <dd className="font-semibold">{t('pricing.perNight', { price: bothRooms })}</dd>
              </div>
            </dl>
            <div className="mt-6 flex items-start gap-3 rounded-md bg-white/8 p-4 text-sm leading-6 text-white/72">
              <UsersRound aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[var(--color-brass)]" />
              <p>
                {t('pricing.maxGuests', { count: pricing.maxGuests })}. {t('pricing.minStay', { count: pricing.minStayNights })}.{' '}
                {localize(pricing.extraInfo, locale)}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
