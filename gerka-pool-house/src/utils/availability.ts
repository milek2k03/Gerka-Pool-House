import type { AvailabilityRange } from '../types/booking'
import { addDays, getTodayISO, toDate, toISODate } from './date'

function getInclusiveRangeEnd(range: AvailabilityRange) {
  if (!range.to || range.to <= range.from) return range.from

  return toISODate(addDays(toDate(range.to), -1))
}

export function isExpiredManualAvailabilityRange(range: AvailabilityRange, today = getTodayISO()) {
  return range.status === 'unavailable' && getInclusiveRangeEnd(range) <= today
}

export function removeExpiredManualAvailabilityRanges(
  ranges: AvailabilityRange[],
  today = getTodayISO(),
) {
  return ranges.filter((range) => !isExpiredManualAvailabilityRange(range, today))
}
