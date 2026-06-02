import { zodResolver } from '@hookform/resolvers/zod'
import { Send } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '../../components/ui/Button'
import type { EmailDeliveryProvider } from '../../services/emailService'
import { emailService } from '../../services/emailService'
import { reservationRepository } from '../../services/reservationRepository'
import type { Locale } from '../../types/common'
import type { AvailabilityRange } from '../../types/booking'
import type { SiteContent } from '../../types/content'
import { formatDate, formatMoney } from '../../utils/format'
import { localize } from '../../utils/locale'
import { addDays, getTomorrowISO, toDate, toISODate } from '../../utils/date'
import { calculateStaySummary } from './booking.utils'
import { bookingSchema, type BookingFormInput, type BookingFormValues } from './booking.schema'
import { AvailabilityCalendar } from './AvailabilityCalendar'

function FieldError({ message }: { message?: string }) {
  const { t } = useTranslation()
  if (!message) return null
  return <p className="mt-1 text-sm text-red-300">{t(message)}</p>
}

function summaryReasonKey(reason?: string) {
  if (reason === 'invalidDates') return 'booking.invalidDates'
  if (reason === 'pastDate') return 'booking.pastDate'
  if (reason === 'minStay') return 'booking.minStay'
  if (reason === 'guestLimit') return 'booking.guestLimit'
  if (reason === 'booked' || reason === 'unavailable') return 'booking.dateBlocked'
  return undefined
}

export function BookingForm({ content, locale }: { content: SiteContent; locale: Locale }) {
  const { t } = useTranslation()
  const [success, setSuccess] = useState<{ reservationNumber: string; provider: EmailDeliveryProvider } | null>(null)
  const [emailFailed, setEmailFailed] = useState<string | null>(null)
  const [submissionFailed, setSubmissionFailed] = useState('')
  const [reservationAvailability, setReservationAvailability] = useState<AvailabilityRange[]>([])
  const earliestCheckIn = getTomorrowISO()
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<BookingFormInput, unknown, BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      checkIn: '',
      checkOut: '',
      guests: content.pricing.room1Capacity,
      fullName: '',
      email: '',
      phone: '',
      message: '',
    },
  })

  const [checkIn, checkOut, guestsValue] = useWatch({
    control,
    name: ['checkIn', 'checkOut', 'guests'],
  })
  const guests = Number(guestsValue || 0)
  const availability = useMemo(
    () => [...content.availability, ...reservationAvailability],
    [content.availability, reservationAvailability],
  )

  const summary = useMemo(
    () => calculateStaySummary(checkIn, checkOut, guests, content.pricing, availability),
    [checkIn, checkOut, guests, availability, content.pricing],
  )

  useEffect(() => {
    let active = true

    const refreshAvailability = async () => {
      try {
        const nextAvailability = await reservationRepository.listAcceptedAvailability()

        if (active) {
          setReservationAvailability(nextAvailability)
        }
      } catch {
        if (active) {
          setReservationAvailability([])
        }
      }
    }

    void refreshAvailability()
    const unsubscribe = reservationRepository.subscribe(refreshAvailability)

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const reasonKey = summaryReasonKey(summary.reason)

  const onSelectCalendarDate = (date: string) => {
    if (date < earliestCheckIn) return

    if (!checkIn || (checkIn && checkOut)) {
      setValue('checkIn', date, { shouldValidate: true })
      setValue('checkOut', '', { shouldValidate: true })
      return
    }

    if (date <= checkIn) {
      setValue('checkIn', date, { shouldValidate: true })
      return
    }

    setValue('checkOut', date, { shouldValidate: true })
  }

  const onSubmit = handleSubmit(async (values) => {
    setEmailFailed(null)
    setSubmissionFailed('')
    const nextSummary = calculateStaySummary(
      values.checkIn,
      values.checkOut,
      Number(values.guests),
      content.pricing,
      availability,
    )

    if (!nextSummary.isValid) return

    let saved

    try {
      saved = await reservationRepository.add({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        guests: Number(values.guests),
        checkIn: values.checkIn,
        checkOut: values.checkOut,
        nights: nextSummary.nights,
        roomsUsed: nextSummary.roomsUsed,
        nightlyPrice: nextSummary.nightlyPrice,
        estimatedTotal: nextSummary.estimatedTotal,
        message: values.message ?? '',
      })
    } catch {
      setSubmissionFailed(t('booking.saveFailed'))
      return
    }

    try {
      const result = await emailService.sendReservationInquiry(saved, content, locale)
      setSuccess({ reservationNumber: saved.reservationNumber, provider: result.provider })
    } catch {
      setEmailFailed(t('booking.emailFailed'))
      setSuccess({ reservationNumber: saved.reservationNumber, provider: 'local' })
    }
    reset({ ...values, fullName: '', email: '', phone: '', message: '' })
  })

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:gap-6">
      <AvailabilityCalendar
        ranges={availability}
        checkIn={checkIn}
        checkOut={checkOut}
        minDate={earliestCheckIn}
        onSelectDate={onSelectCalendarDate}
      />

      <form
        className="min-w-0 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6"
        onSubmit={onSubmit}
        noValidate
      >
        <div className="grid min-w-0 gap-4 sm:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
            {t('booking.checkIn')}
            <input className="field" type="date" min={earliestCheckIn} {...register('checkIn')} />
            <FieldError message={errors.checkIn?.message} />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
            {t('booking.checkOut')}
            <input
              className="field"
              type="date"
              min={checkIn ? toISODate(addDays(toDate(checkIn), 1)) : toISODate(addDays(toDate(earliestCheckIn), 1))}
              {...register('checkOut')}
            />
            <FieldError message={errors.checkOut?.message} />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
            {t('booking.guests')}
            <input className="field" type="number" min={1} max={content.pricing.maxGuests} {...register('guests')} />
            <FieldError message={errors.guests?.message} />
          </label>
        </div>

        <div className="mt-5 min-w-0 rounded-md bg-[var(--color-paper)] p-4">
          <h3 className="text-base font-semibold text-[var(--color-ink)]">{t('booking.summary')}</h3>
          {summary.nights > 0 ? (
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--color-muted)]">{t('booking.selectedDates')}</dt>
                <dd className="font-medium text-[var(--color-ink)]">
                  {formatDate(summary.checkIn, locale)} - {formatDate(summary.checkOut, locale)}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">{t('booking.nights')}</dt>
                <dd className="font-medium text-[var(--color-ink)]">{summary.nights}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">{t('booking.guests')}</dt>
                <dd className="font-medium text-[var(--color-ink)]">{summary.guests}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">{t('booking.rooms')}</dt>
                <dd className="font-medium text-[var(--color-ink)]">
                  {summary.roomLabels.map((room) => t(`booking.${room}`)).join(', ')}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[var(--color-muted)]">{t('booking.estimatedPrice')}</dt>
                <dd className="text-2xl font-semibold text-[var(--color-ink)]">
                  {formatMoney(summary.estimatedTotal, locale, content.pricing.currency)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-sm text-[var(--color-muted)]">{t('booking.chooseDates')}</p>
          )}
          {reasonKey ? <p className="mt-3 text-sm font-medium text-red-300">{t(reasonKey)}</p> : null}
          <p className="mt-3 text-xs leading-5 text-[var(--color-muted)]">{localize(content.pricing.extraInfo, locale)}</p>
        </div>

        <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
            {t('booking.fullName')}
            <input className="field" autoComplete="name" {...register('fullName')} />
            <FieldError message={errors.fullName?.message} />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
            {t('booking.email')}
            <input className="field" type="email" autoComplete="email" {...register('email')} />
            <FieldError message={errors.email?.message} />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
            {t('booking.phone')}
            <input className="field" type="tel" autoComplete="tel" {...register('phone')} />
            <FieldError message={errors.phone?.message} />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)] sm:col-span-2">
            {t('booking.message')}
            <textarea className="field min-h-28 resize-y" {...register('message')} />
            <FieldError message={errors.message?.message} />
          </label>
        </div>

        {success ? (
          <div className="mt-4 rounded-md bg-emerald-950/40 p-3 text-sm text-emerald-200">
            <p>{t('booking.success')}</p>
            <p className="mt-1 font-semibold">
              {t('booking.reservationNumber')}: {success.reservationNumber}
            </p>
            <p className="mt-1">
              {emailFailed
                ? emailFailed
                : success.provider === 'local'
                  ? t('booking.emailQueued')
                  : t('booking.emailSent')}
            </p>
          </div>
        ) : null}

        {submissionFailed ? (
          <p className="mt-4 rounded-md border border-red-400/25 bg-red-950/35 p-3 text-sm text-red-100" role="alert">
            {submissionFailed}
          </p>
        ) : null}

        <Button type="submit" className="mt-5 w-full sm:w-auto" disabled={isSubmitting || !summary.isValid}>
          <Send aria-hidden="true" className="size-4" />
          {t('booking.send')}
        </Button>
      </form>
    </div>
  )
}
