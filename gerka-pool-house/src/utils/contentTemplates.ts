import type { Locale } from '../types/common'
import type { SiteContent } from '../types/content'
import { getApartmentCapacity } from './apartments'
import { formatMoney } from './format'
import { getBothApartmentsNightly, getEffectiveMaxGuests, getStayTimes, getWeeksaveRates, isApartment2Enabled } from './pricing'

export function getContentVariables(content: SiteContent, locale: Locale) {
  const pricing = content.pricing
  const times = getStayTimes(pricing)
  const weeksave = getWeeksaveRates(pricing)
  const priceGround = formatMoney(pricing.room1Nightly, locale, pricing.currency)
  const priceUpper = formatMoney(pricing.room2Nightly, locale, pricing.currency)
  const priceBoth = formatMoney(getBothApartmentsNightly(pricing), locale, pricing.currency)
  const expanded = isApartment2Enabled(pricing)
  const capacityUpper = getApartmentCapacity(pricing, 'upper')
  return {
    brandName: content.brandName,
    contactEmail: content.contact.email,
    contactPhone: content.contact.phone,
    contactAddress: content.contact.address[locale],
    ownerEmail: content.booking.ownerEmail,
    priceGround,
    priceUpper,
    priceBoth,
    apartmentsTitle: locale === 'pl'
      ? (expanded ? 'Dwa apartamenty, prywatna strefa basenowa, sauna i balia' : 'Apartament na parterze, prywatna strefa basenowa, sauna i balia')
      : (expanded ? 'Two apartments, a private pool area, a sauna and a hot tub' : 'Ground-floor apartment, a private pool area, a sauna and a hot tub'),
    apartmentsOffer: locale === 'pl'
      ? (expanded ? `Wybierz apartament na parterze dla maksymalnie ${pricing.room1Capacity} osób, apartament na piętrze dla ${capacityUpper} osób lub wynajmij całość dla maksymalnie ${pricing.maxGuests} osób.` : `Dostępny jest apartament na parterze dla maksymalnie ${pricing.room1Capacity} osób.`)
      : (expanded ? `Choose the ground-floor apartment for up to ${pricing.room1Capacity} guests, the upstairs apartment for ${capacityUpper} guests, or rent both for up to ${pricing.maxGuests} guests.` : `The ground-floor apartment is available for up to ${pricing.room1Capacity} guests.`),
    capacitySummary: locale === 'pl'
      ? `Apartament na parterze mieści do ${pricing.room1Capacity} osób.${expanded ? ` Piętro: do ${capacityUpper} osób. Oba apartamenty razem: do ${pricing.maxGuests} osób.` : ''}`
      : `The ground-floor apartment accommodates up to ${pricing.room1Capacity} guests.${expanded ? ` Upstairs: up to ${capacityUpper} guests. Both apartments together: up to ${pricing.maxGuests} guests.` : ''}`,
    pricingSummary: locale === 'pl'
      ? `Apartament na parterze: ${priceGround} za dobę.${expanded ? ` Apartament na piętrze: ${priceUpper} za dobę. Całość (parter i piętro): ${priceBoth} za dobę.` : ''} Ostateczna cena wymaga potwierdzenia przez właściciela.`
      : `Ground-floor apartment: ${priceGround} per night.${expanded ? ` Upstairs apartment: ${priceUpper} per night. Both apartments together: ${priceBoth} per night.` : ''} The final price requires confirmation by the owner.`,
    checkInTime: times.checkIn,
    checkOutTime: times.checkOut,
    capacityGround: String(pricing.room1Capacity),
    capacityUpper: String(getApartmentCapacity(pricing, 'upper')),
    maxGuests: String(getEffectiveMaxGuests(pricing)),
    minStayNights: String(pricing.minStayNights),
    weeksaveBasePrice: formatMoney(weeksave.base, locale, pricing.currency),
    weeksaveExtraPrice: formatMoney(weeksave.extraGuest, locale, pricing.currency),
  }
}

export function resolveContentText(text: string, content: SiteContent, locale: Locale) {
  const variables = getContentVariables(content, locale)
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (placeholder, key: string) =>
    variables[key as keyof typeof variables] ?? placeholder,
  )
}

// Keep saved templates untouched; resolve a separate copy for public rendering.
export function resolveSiteContent(content: SiteContent): SiteContent {
  const walk = (value: unknown, locale?: Locale): unknown => {
    if (typeof value === 'string') return locale ? resolveContentText(value, content, locale) : value
    if (Array.isArray(value)) return value.map((item) => walk(item, locale))
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, item]) =>
        [key, walk(item, key === 'pl' || key === 'en' ? key : locale)],
      ))
    }
    return value
  }
  const resolved = walk(content) as SiteContent
  if (resolved.hero.mobileUsesDesktop) resolved.hero.mobileImage = resolved.hero.image
  return resolved
}
