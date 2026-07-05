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

function getAutomaticWeeksaveDiscount(checkIn: string, checkOut: string, guests: number) {
  if (!checkIn || !checkOut || checkOut <= checkIn) {
    return undefined
  }

  const nights = eachNight(checkIn, checkOut)
  if (nights.length === 0) {
    return undefined
  }

  if (nights.some((night) => [5, 6, 7].includes(getIsoWeekday(night)))) {
    return undefined
  }

  if (nights.length < 2) {
    return undefined
  }

  if (guests < 2 || guests > 4) {
    return undefined
  }

  return {
    id: 'weeksave-auto',
    code: 'WEEKSAVE',
    percent: 0,
    type: 'permanent' as const,
  }
}

export function getDiscountApplication(
  discounts: DiscountCode[],
  value: string | undefined,
  checkIn: string,
  checkOut: string,
  guests: number,
) {
  const normalized = normalizeDiscountCode(value)

  if (!normalized) {
    const autoDiscount = getAutomaticWeeksaveDiscount(checkIn, checkOut, guests)

    return {
      discount: autoDiscount,
      isApplicable: Boolean(autoDiscount),
      reason: undefined,
    }
  }

  const discount = discounts.find((candidate) => normalizeDiscountCode(candidate.code) === normalized)

  if (!discount) {
    return {
      discount: undefined,
      isApplicable: false,
      reason: 'invalidCode',
    }
  }

  if (normalized === 'WEEKSAVE') {
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      return {
        discount: undefined,
        isApplicable: false,
        reason: undefined,
      }
    }

    const nights = eachNight(checkIn, checkOut)
    if (nights.length === 0) {
      return {
        discount: undefined,
        isApplicable: false,
        reason: undefined,
      }
    }

    if (nights.some((night) => [5, 6, 7].includes(getIsoWeekday(night)))) {
      return {
        discount: undefined,
        isApplicable: false,
        reason: 'weeksaveWeekdays',
      }
    }

    if (nights.length < 2) {
      return {
        discount: undefined,
        isApplicable: false,
        reason: 'weeksaveMinNights',
      }
    }

    if (guests < 2) {
      return {
        discount: undefined,
        isApplicable: false,
        reason: 'weeksaveMinGuests',
      }
    }

    if (guests > 4) {
      return {
        discount: undefined,
        isApplicable: false,
        reason: 'weeksaveMaxGuests',
      }
    }

    return {
      discount,
      isApplicable: true,
      reason: undefined,
    }
  }

  const isApplicable = isDiscountEligible(discount, checkIn, checkOut)

  return {
    discount: isApplicable ? discount : undefined,
    isApplicable,
    reason: isApplicable ? undefined : 'invalidCode',
  }
}

export function findApplicableDiscount(
  discounts: DiscountCode[],
  value: string | undefined,
  checkIn: string,
  checkOut: string,
  guests?: number,
) {
  return getDiscountApplication(discounts, value, checkIn, checkOut, guests ?? 0).discount
}

export function getDiscountValidationReason(
  discounts: DiscountCode[],
  value: string | undefined,
  checkIn: string,
  checkOut: string,
  guests: number,
) {
  return getDiscountApplication(discounts, value, checkIn, checkOut, guests).reason
}
