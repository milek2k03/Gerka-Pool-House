import { eachDayOfInterval, endOfMonth, startOfMonth } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { AvailabilityRange } from '../../types/booking'
import { cn } from '../../utils/cn'
import { isDateWithinRange, toISODate } from '../../utils/date'
import { Button } from '../../components/ui/Button'
import { getLocale } from '../../utils/locale'

interface AvailabilityCalendarProps {
  ranges: AvailabilityRange[]
  checkIn?: string
  checkOut?: string
  minDate: string
  onSelectDate: (date: string) => void
}

function getStatus(date: string, ranges: AvailabilityRange[]) {
  const matchingRanges = ranges.filter((range) => isDateWithinRange(date, range.from, range.to))

  if (matchingRanges.some((range) => range.status === 'booked')) return 'booked'
  if (matchingRanges.some((range) => range.status === 'unavailable')) return 'unavailable'

  return 'available'
}

export function AvailabilityCalendar({ ranges, checkIn, checkOut, minDate, onSelectDate }: AvailabilityCalendarProps) {
  const { t, i18n } = useTranslation()
  const locale = getLocale(i18n.language)
  const minMonth = useMemo(() => startOfMonth(new Date()), [])
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const canGoPrevious = month > minMonth

  const days = useMemo(() => {
    const start = startOfMonth(month)
    const end = endOfMonth(month)
    const startPadding = (start.getDay() + 6) % 7
    return [
      ...Array.from<null>({ length: startPadding }).fill(null),
      ...eachDayOfInterval({ start, end }),
    ]
  }, [month])

  return (
    <div className="min-w-0 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-soft)] sm:p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Previous month"
          disabled={!canGoPrevious}
          onClick={() => {
            if (!canGoPrevious) return
            setMonth((value) => startOfMonth(new Date(value.getFullYear(), value.getMonth() - 1)))
          }}
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </Button>
        <h3 className="text-base font-semibold text-[var(--color-ink)]">
          {new Intl.DateTimeFormat(locale === 'pl' ? 'pl-PL' : 'en-US', {
            month: 'long',
            year: 'numeric',
          }).format(month)}
        </h3>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Next month"
          onClick={() => setMonth((value) => startOfMonth(new Date(value.getFullYear(), value.getMonth() + 1)))}
        >
          <ChevronRight aria-hidden="true" className="size-5" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[var(--color-muted)]">
        {(locale === 'pl' ? ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'] : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']).map((day) => (
          <span key={day} className="py-2">
            {day}
          </span>
        ))}
      </div>
      <div className="grid min-w-0 grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) {
            return <span key={`empty-${index}`} aria-hidden="true" className="aspect-square" />
          }

          const date = toISODate(day)
          const status = getStatus(date, ranges)
          const isSelected = date === checkIn || date === checkOut
          const isBetween = Boolean(checkIn && checkOut && date > checkIn && date < checkOut)
          const isPast = date < minDate
          const displayStatus = status === 'available' && isPast ? 'unavailable' : status
          const disabled = displayStatus !== 'available' || isPast
          const statusLabel =
            displayStatus === 'booked'
              ? t('booking.booked')
              : displayStatus === 'unavailable'
                ? t('booking.unavailable')
                : t('booking.available')

          return (
            <button
              key={date}
              type="button"
              disabled={disabled}
              aria-label={`${new Intl.DateTimeFormat(locale === 'pl' ? 'pl-PL' : 'en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }).format(day)}: ${statusLabel}`}
              onClick={() => onSelectDate(date)}
              className={cn(
                'aspect-square rounded-xl text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brass)]',
                displayStatus === 'available' && !isPast && 'bg-[var(--color-surface-2)] text-[var(--color-ink)] hover:bg-[var(--color-brass)] hover:text-[#111827]',
                displayStatus === 'booked' &&
                  'cursor-not-allowed border border-[#b87979]/25 bg-[#5c3030]/55 text-[#f3dddd]',
                displayStatus === 'unavailable' &&
                  'calendar-unavailable cursor-not-allowed border border-sky-300/25 text-sky-100',
                isBetween && 'bg-[rgba(214,181,138,0.14)]',
                isSelected && 'bg-[var(--color-brass)] text-[#111827]',
              )}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--color-muted)]">
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-sm bg-[var(--color-surface-2)]" /> {t('booking.available')}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-sm bg-[#5c3030]/55 ring-1 ring-[#b87979]/25" /> {t('booking.booked')}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="calendar-unavailable size-3 rounded-sm ring-1 ring-sky-300/25" /> {t('booking.unavailable')}
        </span>
      </div>
    </div>
  )
}
