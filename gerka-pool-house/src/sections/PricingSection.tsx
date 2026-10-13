import { Calculator, UsersRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { SectionHeading } from '../components/ui/SectionHeading'
import type { Locale } from '../types/common'
import type { PriceSettings } from '../types/content'
import { formatMoney } from '../utils/format'
import { localize } from '../utils/locale'
import { getBothApartmentsNightly, getEffectiveMaxGuests, getStayTimes, getWeeksaveRates, isApartment2Enabled } from '../utils/pricing'
import { getApartmentCapacity } from '../utils/apartments'

export function PricingSection({ pricing, locale }: { pricing: PriceSettings; locale: Locale }) {
  const { t } = useTranslation()
  const room2Enabled = isApartment2Enabled(pricing)
  const fixedApartmentPricing = !room2Enabled
  const maxGuests = getEffectiveMaxGuests(pricing)
  const times = getStayTimes(pricing)
  const promo = getWeeksaveRates(pricing)
  const room1 = formatMoney(pricing.room1Nightly, locale, pricing.currency)
  const bothRooms = formatMoney(getBothApartmentsNightly(pricing), locale, pricing.currency)

  return (
    <section id="pricing" className="section-spacing bg-[var(--color-paper)] px-5 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow={t('sections.pricingEyebrow')}
          title={t('sections.pricingTitle')}
          lead={fixedApartmentPricing ? t('sections.pricingLead', { count: maxGuests, price: room1 }) : t('sections.pricingLeadExpanded')}
          tone="dark"
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)]">
            <table className="w-full table-fixed text-left text-sm sm:text-base">
              <caption className="sr-only">{t('sections.pricingTitle')}</caption>
              <thead className="bg-[var(--color-surface-2)] text-sm text-[var(--color-muted)]">
                <tr>
                  <th className="w-[36%] px-3 py-4 font-semibold sm:px-5">{t('pricing.room')}</th>
                  <th className="w-[34%] px-3 py-4 font-semibold sm:px-5">{t('pricing.capacity')}</th>
                  <th className="w-[30%] px-3 py-4 font-semibold sm:px-5">
                    {fixedApartmentPricing ? t('pricing.priceApartmentNight') : t('pricing.priceNight')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-white">
                <tr>
                  <td className="px-3 py-5 align-top sm:px-5">
                    <span className="block font-semibold sm:inline">
                      {t('pricing.groundApartment')}
                    </span>
                  </td>
                  <td className="break-words px-3 py-5 align-top leading-6 sm:px-5">{t('pricing.upToGuests', { count: pricing.room1Capacity })}</td>
                  <td className="break-words px-3 py-5 align-top font-semibold leading-6 sm:px-5 sm:text-lg">
                    {fixedApartmentPricing ? t('pricing.apartmentPerNight', { price: room1 }) : room1}
                  </td>
                </tr>
                {room2Enabled ? (
                  <tr>
                    <td className="px-3 py-5 align-top sm:px-5">
                      <span className="block font-semibold sm:inline">{t('pricing.upperApartment')}</span>
                    </td>
                    <td className="break-words px-3 py-5 align-top leading-6 sm:px-5">
                      {t('pricing.upToGuests', { count: getApartmentCapacity(pricing, 'upper') })}
                    </td>
                    <td className="break-words px-3 py-5 align-top font-semibold leading-6 sm:px-5 sm:text-lg">
                      {formatMoney(pricing.room2Nightly, locale, pricing.currency)}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            <div className="border-t border-[var(--color-border)] bg-[rgba(214,181,138,0.14)] p-4 text-sm leading-6 text-[var(--color-muted)] sm:p-5">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-brass)]">
                {t('pricing.weekendRateTitle')}
              </span>
              <p className="mt-2 text-white">{t('pricing.weekendRateOffer', { price: room1 })}</p>
            </div>
            <div className="border-t border-[var(--color-border)] bg-[rgba(214,181,138,0.10)] p-4 text-sm leading-6 text-[var(--color-muted)] sm:p-5">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-brass)]">
                {t('pricing.weeksaveTitle')}
              </span>
              <p className="mt-2 text-white">{t('pricing.weeksaveOffer', { basePrice: formatMoney(promo.base, locale, pricing.currency), extraPrice: formatMoney(promo.extraGuest, locale, pricing.currency) })}</p>
            </div>
          </div>

          <aside className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
            <div className="grid size-12 place-items-center rounded-xl bg-[var(--color-brass)] text-[#111827]">
              <Calculator aria-hidden="true" className="size-6" />
            </div>
            <h3 className="mt-5 text-xl font-semibold">
              {fixedApartmentPricing ? t('pricing.fixedTitle') : t('pricing.exampleTitle')}
            </h3>
            {fixedApartmentPricing ? (
              <div className="mt-5 grid gap-4 text-sm leading-6 text-[var(--color-muted)]">
                <p>{t('pricing.fixedLead', { count: maxGuests })}</p>
                <p>{t('pricing.fixedSamePrice', { count: maxGuests })}</p>
                <div className="rounded-[1.1rem] border border-[var(--color-brass)] bg-[rgba(214,181,138,0.10)] p-4">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-brass)]">
                    {t('pricing.currentRate')}
                  </span>
                  <span className="mt-2 block text-2xl font-semibold text-white">
                    {t('pricing.apartmentPerNight', { price: room1 })}
                  </span>
                </div>
              </div>
            ) : (
              <dl className="mt-5 grid gap-4 text-sm">
                {[
                  { label: t('pricing.groundApartment'), price: room1 },
                  { label: t('pricing.upperApartment'), price: formatMoney(pricing.room2Nightly, locale, pricing.currency) },
                  { label: t('pricing.bothApartments'), price: bothRooms },
                ].map(({ label, price }) => (
                  <div key={label} className="flex items-center justify-between gap-4">
                    <dt className="text-[var(--color-muted)]">{label}</dt>
                    <dd className="shrink-0 font-semibold">{t('pricing.perNight', { price })}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="mt-6 flex items-start gap-3 rounded-[1.1rem] bg-[var(--color-surface-2)] p-4 text-sm leading-6 text-[var(--color-muted)]">
              <UsersRound aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[var(--color-brass)]" />
              <p>
                {t('pricing.maxGuests', { count: maxGuests })}. {t('pricing.minStay', { count: pricing.minStayNights })}. {t('pricing.hotelDay', { checkInTime: times.checkIn, checkOutTime: times.checkOut })}.
                {fixedApartmentPricing ? ` ${t('pricing.fixedIncluded', { count: maxGuests })}` : ` ${localize(pricing.extraInfo, locale)}`}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
