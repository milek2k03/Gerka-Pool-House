import type { ApartmentSelection } from '../types/booking'
import type { PriceSettings } from '../types/content'

export function apartmentsOverlap(first: ApartmentSelection = 'both', second: ApartmentSelection = 'both') {
  return first === 'both' || second === 'both' || first === second
}

export function getReservationApartment(item: { apartment?: ApartmentSelection; roomsUsed: number }): ApartmentSelection {
  return item.apartment ?? (item.roomsUsed > 1 ? 'both' : 'ground')
}

export function getApartmentCapacity(pricing: PriceSettings, apartment: ApartmentSelection) {
  if (apartment === 'ground') return pricing.room1Capacity
  if (apartment === 'upper') return Math.max(0, pricing.maxGuests - pricing.room1Capacity)
  return pricing.maxGuests
}

export function apartmentLabel(apartment: ApartmentSelection, locale: 'pl' | 'en') {
  const labels = {
    pl: { ground: 'Apartament na parterze', upper: 'Apartament na piętrze', both: 'Oba apartamenty (parter i piętro)' },
    en: { ground: 'Ground-floor apartment', upper: 'Upstairs apartment', both: 'Both apartments (ground floor and upstairs)' },
  }
  return labels[locale][apartment]
}
