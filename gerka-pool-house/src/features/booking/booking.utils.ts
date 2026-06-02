import type { AvailabilityRange, StaySummary } from '../../types/booking'
import type { PriceSettings } from '../../types/content'
import { eachNight, getTomorrowISO, isDateWithinRange, nightsBetween } from '../../utils/date'

export function calculateStaySummary(
  checkIn: string,
  checkOut: string,
  guests: number,
  pricing: PriceSettings,
  availability: AvailabilityRange[],
): StaySummary {
  const nights = nightsBetween(checkIn, checkOut)
  const roomsUsed = guests > pricing.room1Capacity ? 2 : 1
  const nightlyPrice = roomsUsed === 1 ? pricing.room1Nightly : pricing.room1Nightly + pricing.room2Nightly
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
      estimatedTotal: nightlyPrice * nights,
      isAvailable: true,
      isValid: false,
      reason: 'pastDate',
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
      estimatedTotal: nightlyPrice * nights,
      isAvailable: true,
      isValid: false,
      reason: 'minStay',
    }
  }

  if (guests < 1 || guests > pricing.maxGuests) {
    return {
      checkIn,
      checkOut,
      guests,
      nights,
      roomsUsed,
      roomLabels,
      nightlyPrice,
      estimatedTotal: nightlyPrice * nights,
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
    estimatedTotal: nightlyPrice * nights,
    isAvailable: !blockedRange,
    isValid: !blockedRange,
    reason: blockedRange ? blockedRange.status : undefined,
  }
}
