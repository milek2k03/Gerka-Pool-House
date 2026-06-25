import type { DiscountCode, DiscountWeekday } from '../types/content'
import { eachNight, toDate } from './date'

export function normalizeDiscountCode(value?: string) {
  return (value ?? '').trim().replace(/\s+/g, '').toUpperCase()
}

export function clampDiscountPercent(value: number) {
  return Math.min(100, Math.max(1, Math.round(value)))
}

export function getIsoWeekday(date: string): DiscountWeekday {
  const day = toDate(date).getDay()

  return (day === 0 ? 7 : day) as DiscountWeekday
}

export function isDiscountEligible(discount: DiscountCode, checkIn: string, checkOut: string) {
  const type = discount.type ?? 'permanent'

  if (type === 'permanent') return true

  const nights = eachNight(checkIn, checkOut)
  if (nights.length === 0) return false

  if (type === 'dateRange') {
    if (!discount.validFrom || !discount.validTo || discount.validTo < discount.validFrom) return false

    return nights.every((night) => night >= discount.validFrom! && night <= discount.validTo!)
  }

  const weekdays = discount.weekdays ?? []
  if (weekdays.length === 0) return false

  return nights.every((night) => weekdays.includes(getIsoWeekday(night)))
}

export function findApplicableDiscount(
  discounts: DiscountCode[],
  value: string | undefined,
  checkIn: string,
  checkOut: string,
) {
  const normalized = normalizeDiscountCode(value)

  if (!normalized) return undefined

  return discounts.find(
    (discount) =>
      normalizeDiscountCode(discount.code) === normalized &&
      isDiscountEligible(discount, checkIn, checkOut),
  )
}
