const dayMs = 24 * 60 * 60 * 1000

export function toDate(value: string) {
  return new Date(`${value}T12:00:00`)
}

export function toISODate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function nightsBetween(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0
  const diff = toDate(checkOut).getTime() - toDate(checkIn).getTime()
  return Math.max(0, Math.round(diff / dayMs))
}

export function eachNight(checkIn: string, checkOut: string) {
  const nights = nightsBetween(checkIn, checkOut)
  return Array.from({ length: nights }, (_, index) => toISODate(addDays(toDate(checkIn), index)))
}

export function isDateWithinRange(date: string, from: string, to: string) {
  return date >= from && date < to
}

export function getTodayISO() {
  return toISODate(new Date())
}

export function getTomorrowISO() {
  return toISODate(addDays(new Date(), 1))
}
