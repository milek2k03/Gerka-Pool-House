import type { AvailabilityRange, StaySummary } from '../../types/booking'
import type { DiscountCode, PriceSettings } from '../../types/content'
import { eachNight, getTomorrowISO, isDateWithinRange, nightsBetween } from '../../utils/date'
import {
  clampDiscountPercent,
  findApplicableDiscount,
  getDiscountValidationReason,
  normalizeDiscountCode,
} from '../../utils/discounts'
import { getEffectiveMaxGuests, isApartment2Enabled } from '../../utils/pricing'

function createDiscountedPrice(total: number, discount?: DiscountCode, guests?: number, checkIn?: string, checkOut?: string) {
  if (!discount) {
    return {
      priceBeforeDiscount: total,
      estimatedTotal: total,
      discountCode: undefined,
      discountPercent: undefined,
      discountAmount: 0,
      discountKind: undefined,
      discountValidationReason: undefined,
    }
  }

  const normalizedCode = normalizeDiscountCode(discount.code)

  if (normalizedCode === 'WEEKSAVE' && guests && checkIn && checkOut) {
    const weeksaveNightlyRate = 500 + Math.max(guests - 2, 0) * 200
    const nights = nightsBetween(checkIn, checkOut)
    const weeksaveTotal = weeksaveNightlyRate * nights

    return {
      priceBeforeDiscount: total,
      estimatedTotal: weeksaveTotal,
      discountCode: normalizedCode,
      discountPercent: undefined,
      discountAmount: Math.max(0, total - weeksaveTotal),
      discountKind: 'weeksave' as const,
      discountValidationReason: undefined,
    }
  }

  const discountPercent = clampDiscountPercent(discount.percent)
  const discountAmount = Math.round(total * (discountPercent / 100))

  return {
    priceBeforeDiscount: total,
    estimatedTotal: Math.max(0, total - discountAmount),
    discountCode: normalizedCode,
    discountPercent,
    discountAmount,
    discountKind: 'percent' as const,
    discountValidationReason: undefined,
  }
}

export function calculateStaySummary(
  checkIn: string,
  checkOut: string,
  guests: number,
  pricing: PriceSettings,
  availability: AvailabilityRange[],
  discountCode?: string,
): StaySummary {
  const nights = nightsBetween(checkIn, checkOut)
  const room2Enabled = isApartment2Enabled(pricing)
  const maxGuests = getEffectiveMaxGuests(pricing)
  const roomsUsed = room2Enabled && guests > pricing.room1Capacity ? 2 : 1
  const nightlyPrice = roomsUsed === 1 ? pricing.room1Nightly : pricing.room1Nightly + pricing.room2Nightly
  const baseTotal = nightlyPrice * nights
  const discount = findApplicableDiscount(pricing.discounts ?? [], discountCode, checkIn, checkOut, guests)
  const discountedPrice = createDiscountedPrice(baseTotal, discount, guests, checkIn, checkOut)
  const discountValidationReason = getDiscountValidationReason(pricing.discounts ?? [], discountCode, checkIn, checkOut, guests)
  const roomLabels = roomsUsed === 1 ? ['room1'] : ['room1', 'room2']
  const selectedNights = eachNight(checkIn, checkOut)
  const blockedRange = availability.find((range) =>
    selectedNights.some((night) => isDateWithinRange(night, range.from, range.to)),
  )
  const earliestCheckIn = getTomorrowISO()

  if (!checkIn || !checkOut || nights === 0 || checkOut <= checkIn) {
    return {
      checkIn,
      checkOut,
      guests,
      nights,
      roomsUsed,
      roomLabels,
      nightlyPrice,
      priceBeforeDiscount: 0,
      estimatedTotal: 0,
      isAvailable: true,
      isValid: false,
      reason: 'invalidDates',
    }
  }

  if (checkIn < earliestCheckIn) {
    return {
      checkIn,
      checkOut,
      guests,
      nights,
      roomsUsed,
      roomLabels,
      nightlyPrice,
      ...discountedPrice,
      discountValidationReason: undefined,
      isAvailable: true,
      isValid: false,
      reason: 'pastDate',
    }
  }

  if (guests < 1) {
    return {
      checkIn,
      checkOut,
      guests,
      nights,
      roomsUsed,
      roomLabels,
      nightlyPrice,
      priceBeforeDiscount: 0,
      estimatedTotal: 0,
      isAvailable: true,
      isValid: false,
      reason: 'minGuests',
    }
  }

  if (nights < pricing.minStayNights) {
    return {
      checkIn,
      checkOut,
      guests,
      nights,
      roomsUsed,
      roomLabels,
      nightlyPrice,
      ...discountedPrice,
      discountValidationReason: undefined,
      isAvailable: true,
      isValid: false,
      reason: 'minStay',
    }
  }

  if (guests < 1 || guests > maxGuests) {
    return {
      checkIn,
      checkOut,
      guests,
      nights,
      roomsUsed,
      roomLabels,
      nightlyPrice,
      ...discountedPrice,
      discountValidationReason: undefined,
      isAvailable: true,
      isValid: false,
      reason: 'guestLimit',
    }
  }

  return {
    checkIn,
    checkOut,
    guests,
    nights,
    roomsUsed,
    roomLabels,
    nightlyPrice,
    ...discountedPrice,
    discountValidationReason: discountValidationReason && (!discountedPrice.discountCode || discountValidationReason !== 'invalidCode') ? discountValidationReason : undefined,
    isAvailable: !blockedRange,
    isValid: !blockedRange,
    reason: blockedRange ? blockedRange.status : undefined,
  }
}
