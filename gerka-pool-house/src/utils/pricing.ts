import type { PriceSettings } from '../types/content'

export function isApartment2Enabled(pricing: PriceSettings) {
  return pricing.room2Enabled !== false
}

export function getEffectiveMaxGuests(pricing: PriceSettings) {
  return isApartment2Enabled(pricing) ? pricing.maxGuests : pricing.room1Capacity
}

export function applyGuestLimitToText(value: string, pricing: PriceSettings) {
  const maxGuests = getEffectiveMaxGuests(pricing)

  return value
    .replace(/do\s+\d+\s+osób/gi, `do ${maxGuests} osób`)
    .replace(/do\s+\d+\s+osob/gi, `do ${maxGuests} osób`)
    .replace(/maksymalnie\s+\d+\s+osób/gi, `maksymalnie ${maxGuests} osób`)
    .replace(/maksymalnie\s+\d+\s+osob/gi, `maksymalnie ${maxGuests} osób`)
    .replace(/wynosi\s+\d+\s+osób/gi, `wynosi ${maxGuests} osób`)
    .replace(/wynosi\s+\d+\s+osob/gi, `wynosi ${maxGuests} osób`)
    .replace(/liczących\s+do\s+\d+\s+osób/gi, `liczących do ${maxGuests} osób`)
    .replace(/liczacych\s+do\s+\d+\s+osob/gi, `liczących do ${maxGuests} osób`)
    .replace(/od\s+1\s+do\s+\d+\s+osób/gi, `od 1 do ${maxGuests} osób`)
    .replace(/od\s+1\s+do\s+\d+\s+osob/gi, `od 1 do ${maxGuests} osób`)
    .replace(/up to\s+\d+\s+guests/gi, `up to ${maxGuests} guests`)
    .replace(/1 to\s+\d+\s+guests/gi, `1 to ${maxGuests} guests`)
    .replace(/is\s+\d+\s+guests/gi, `is ${maxGuests} guests`)
}
