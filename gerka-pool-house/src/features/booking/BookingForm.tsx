import { zodResolver } from '@hookform/resolvers/zod'
import { Send } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { cn } from '../../utils/cn'
import { apartmentsOverlap, getApartmentCapacity } from '../../utils/apartments'
import { isApartment2Enabled } from '../../utils/pricing'
import { calculateStaySummary } from './booking.utils'
import { normalizeDiscountCode } from '../../utils/discounts'
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
  if (reason === 'minGuests') return 'booking.minGuests'
  if (reason === 'guestLimit') return 'booking.guestLimit'
  if (reason === 'booked' || reason === 'unavailable') return 'booking.dateBlocked'
  return undefined
}

function getDiscountStatusMessage(t: ReturnType<typeof useTranslation>['t'], reason?: string) {
  if (!reason) return undefined

  switch (reason) {
    case 'weeksaveWeekdays':
      return t('booking.discountWeeksaveWeekdays')
    case 'weeksaveMinNights':
      return t('booking.discountWeeksaveMinNights')
    case 'weeksaveMinGuests':
      return t('booking.discountWeeksaveMinGuests')
    case 'weeksaveMaxGuests':
      return t('booking.discountWeeksaveMaxGuests')
    default:
      return t('booking.discountInvalid')
  }
}

export function BookingForm({ content, locale }: { content: SiteContent; locale: Locale }) {
  const { t } = useTranslation()
  const [success, setSuccess] = useState<{ reservationNumber: string; provider: EmailDeliveryProvider } | null>(null)
  const [emailFailed, setEmailFailed] = useState<string | null>(null)
  const [submissionFailed, setSubmissionFailed] = useState('')
  const [availabilityFailed, setAvailabilityFailed] = useState(false)
  const [availabilityLoading, setAvailabilityLoading] = useState(true)
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
      apartment: 'ground',
      checkIn: '',
      checkOut: '',
      guests: 0,
      discountCode: '',
      fullName: '',
      email: '',
      phone: '',
      message: '',
      privacyConsent: false,
    },
  })

  const [checkIn, checkOut, guestsValue, discountCode, selectedApartment] = useWatch({
    control,
    name: ['checkIn', 'checkOut', 'guests', 'discountCode', 'apartment'],
  })
  const guests = Number(guestsValue || 0)
  const normalizedDiscountCode = normalizeDiscountCode(discountCode)
  const availability = useMemo(
    () => [...content.availability, ...reservationAvailability],
    [content.availability, reservationAvailability],
  )
  const room2Enabled = isApartment2Enabled(content.pricing)
  const apartment = room2Enabled ? selectedApartment ?? 'ground' : 'ground'
  const maxGuests = getApartmentCapacity(content.pricing, apartment)

  const summary = useMemo(
    () => calculateStaySummary(checkIn, checkOut, guests, content.pricing, availability, discountCode, apartment),
    [checkIn, checkOut, guests, availability, content.pricing, discountCode, apartment],
  )

  useEffect(() => {
    let active = true

    const refreshAvailability = async () => {
      try {
        const nextAvailability = await reservationRepository.listAcceptedAvailability()

        if (active) {
          setReservationAvailability(nextAvailability)
          setAvailabilityFailed(false)
        }
      } catch {
        if (active) {
          setAvailabilityFailed(true)
        }
      } finally {
        if (active) setAvailabilityLoading(false)
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

  const onSelectCalendarDate = useCallback((date: string) => {
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
  }, [checkIn, checkOut, earliestCheckIn, setValue])

  const onSubmit = handleSubmit(async (values) => {
    setEmailFailed(null)
    setSubmissionFailed('')
    let latestAvailability: AvailabilityRange[]
    try {
      latestAvailability = await reservationRepository.listAcceptedAvailability()
      setReservationAvailability(latestAvailability)
      setAvailabilityFailed(false)
    } catch {
      setAvailabilityFailed(true)
      return
    }
    const nextSummary = calculateStaySummary(
      values.checkIn,
      values.checkOut,
      Number(values.guests),
      content.pricing,
      [...content.availability, ...latestAvailability],
      values.discountCode,
      room2Enabled ? values.apartment : 'ground',
    )

    if (!nextSummary.isValid) {
      setSubmissionFailed(t(summaryReasonKey(nextSummary.reason) ?? 'booking.dateBlocked'))
      return
    }

    let saved

    const discountOwnerNote =
      nextSummary.discountCode && nextSummary.discountPercent
        ? t('booking.discountOwnerNote', {
            code: nextSummary.discountCode,
            percent: nextSummary.discountPercent,
            before: formatMoney(nextSummary.priceBeforeDiscount, locale, content.pricing.currency),
            after: formatMoney(nextSummary.estimatedTotal, locale, content.pricing.currency),
          })
        : ''
    const message = [discountOwnerNote, values.message ? `${t('booking.clientMessagePrefix')}\n${values.message}` : '']
      .filter(Boolean)
      .join('\n\n')

    try {
      saved = await reservationRepository.add({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        guests: Number(values.guests),
        checkIn: values.checkIn,
        checkOut: values.checkOut,
        nights: nextSummary.nights,
        apartment: nextSummary.apartment,
        roomsUsed: nextSummary.roomsUsed,
        nightlyPrice: nextSummary.nightlyPrice,
        estimatedTotal: nextSummary.estimatedTotal,
        message,
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
    reset({ ...values, discountCode: '', fullName: '', email: '', phone: '', message: '', privacyConsent: false })
  })

  const discountInvalid = Boolean(normalizedDiscountCode && !summary.discountCode)
  const discountStatus =
    summary.discountCode && (summary.discountPercent || summary.discountKind === 'weeksave')
      ? summary.discountKind === 'weeksave'
        ? t('booking.discountAppliedWeeksave', { code: summary.discountCode })
        : t('booking.discountApplied', {
            code: summary.discountCode,
            percent: summary.discountPercent,
          })
      : discountInvalid
        ? getDiscountStatusMessage(t, summary.discountValidationReason) ?? t('booking.discountInvalid')
        : ''

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:gap-6">
      <div className="grid content-start gap-5">
        {(room2Enabled ? ['ground', 'upper'] as const : ['ground'] as const).map((calendarApartment) => (
          <div key={calendarApartment}>
            <h3 className="mb-3 font-semibold text-[var(--color-ink)]">
              {t(calendarApartment === 'ground' ? 'booking.groundApartment' : 'booking.upperApartment')}
            </h3>
            <AvailabilityCalendar
              ranges={availability.filter((range) => apartmentsOverlap(calendarApartment, range.apartment))}
              checkIn={apartmentsOverlap(apartment, calendarApartment) ? checkIn : undefined}
              checkOut={apartmentsOverlap(apartment, calendarApartment) ? checkOut : undefined}
              minDate={earliestCheckIn}
              onSelectDate={(date) => {
                if (apartment !== 'both' && apartment !== calendarApartment) {
                  setValue('apartment', calendarApartment, { shouldValidate: true })
                  setValue('checkIn', date, { shouldValidate: true })
                  setValue('checkOut', '', { shouldValidate: true })
                  return
                }
                onSelectCalendarDate(date)
              }}
            />
          </div>
        ))}
      </div>

      <form
        className="min-w-0 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-soft)] sm:p-6"
        onSubmit={onSubmit}
        noValidate
      >
        {room2Enabled ? (
          <label className="mb-4 grid gap-2 text-sm font-medium text-[var(--color-ink)]">
            {t('booking.apartment')}
            <select className="field" {...register('apartment')}>
              <option value="ground">{t('booking.groundApartment')}</option>
              <option value="upper">{t('booking.upperApartment')}</option>
              <option value="both">{t('booking.bothApartments')}</option>
            </select>
          </label>
        ) : null}
        <div className="grid min-w-0 gap-4 rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-paper-2)] p-4 sm:grid-cols-3">
          <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--color-ink)]">
            {t('booking.checkIn')}
            <input className="field" type="date" min={earliestCheckIn} {...register('checkIn')} />
            <FieldError message={errors.checkIn?.message} />
          </label>
          <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--color-ink)]">
            {t('booking.checkOut')}
            <input
              className="field"
              type="date"
              min={checkIn ? toISODate(addDays(toDate(checkIn), 1)) : toISODate(addDays(toDate(earliestCheckIn), 1))}
              {...register('checkOut')}
            />
            <FieldError message={errors.checkOut?.message} />
          </label>
          <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--color-ink)]">
            {t('booking.guests')}
            <input className="field" type="number" min={0} max={maxGuests} {...register('guests')} />
            <FieldError message={errors.guests?.message} />
          </label>
        </div>

        <div className="mt-5 min-w-0 rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-paper-2)] p-4 sm:p-5">
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
                <dt className="text-[var(--color-muted)]">
                  {room2Enabled ? t('booking.rooms') : t('booking.apartment')}
                </dt>
                <dd className="font-medium text-[var(--color-ink)]">
                  {room2Enabled ? summary.roomLabels.map((room) => t(`booking.${room}`)).join(', ') : t('booking.groundApartment')}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="sr-only">{t(room2Enabled ? 'booking.estimatedPrice' : 'booking.apartmentPrice')}</dt>
                <dd
                  className={cn(
                    'mt-1 rounded-[1.1rem] border p-4',
                    summary.discountCode
                      ? 'border-emerald-400/20 bg-emerald-950/15'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)]',
                  )}
                >
                  {summary.discountCode && (summary.discountPercent || summary.discountKind === 'weeksave') ? (
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                      <div className="grid gap-1">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                          {t('booking.priceBeforeDiscount')}
                        </span>
                        <span className="text-base font-semibold text-[var(--color-muted)] line-through">
                          {formatMoney(summary.priceBeforeDiscount, locale, content.pricing.currency)}
                        </span>
                      </div>
                      <div className="grid gap-1 sm:text-right">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
                          {t('booking.priceAfterDiscount')}
                        </span>
                        <span className="text-3xl font-semibold text-[var(--color-ink)]">
                          {formatMoney(summary.estimatedTotal, locale, content.pricing.currency)}
                        </span>
                      </div>
                      <span className="inline-flex w-fit rounded-full border border-emerald-400/20 bg-emerald-950/45 px-3 py-1 text-xs font-semibold text-emerald-100 sm:col-span-2">
                        {summary.discountKind === 'weeksave'
                          ? t('booking.weeksaveBadge', { code: summary.discountCode })
                          : `-${summary.discountPercent}% ${summary.discountCode}`}
                      </span>
                    </div>
                  ) : (
                    <div className="grid gap-1">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                        {t(room2Enabled ? 'booking.estimatedPrice' : 'booking.apartmentPrice')}
                      </span>
                      <span className="text-3xl font-semibold text-[var(--color-ink)]">
                        {formatMoney(summary.estimatedTotal, locale, content.pricing.currency)}
                      </span>
                    </div>
                  )}
                </dd>
              </div>
              {!room2Enabled ? (
                <p className="rounded-[1rem] border border-[var(--color-brass)] bg-[rgba(214,181,138,0.10)] p-3 text-xs leading-5 text-[var(--color-muted)] sm:col-span-2">
                  {t('booking.fixedApartmentPriceNote', { count: maxGuests, price: formatMoney(content.pricing.room1Nightly, locale, content.pricing.currency) })}
                </p>
              ) : null}
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

        <div className="mt-4 rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-paper-2)] p-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 size-4 shrink-0 accent-[var(--color-brass)]"
              {...register('privacyConsent')}
            />
            <span className="grid gap-2 text-sm leading-6 text-[var(--color-muted)]">
              <span className="font-semibold text-[var(--color-ink)]">{t('booking.privacyConsentTitle')}</span>
              <span>{t('booking.privacyConsentText')}</span>
            </span>
          </label>
          <FieldError message={errors.privacyConsent?.message} />
        </div>

        {success ? (
          <div className="mt-4 rounded-[1rem] bg-emerald-950/40 p-3 text-sm text-emerald-200">
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

        {availabilityFailed ? (
          <p className="mt-4 text-sm text-red-300" role="alert">{t('booking.availabilityFailed')}</p>
        ) : null}
        {submissionFailed ? (
          <p className="mt-4 rounded-[1rem] border border-red-400/25 bg-red-950/35 p-3 text-sm text-red-100" role="alert">
            {submissionFailed}
          </p>
        ) : null}

        <div className="mt-5 grid min-w-0 gap-3 xl:grid-cols-[auto_minmax(16rem,21rem)] xl:items-start">
          <Button type="submit" className="w-full xl:min-w-80 xl:self-start" disabled={isSubmitting || availabilityLoading || availabilityFailed || !summary.isValid}>
            <Send aria-hidden="true" className="size-4" />
            {t('booking.send')}
          </Button>

          <div className="relative min-w-0">
            <label
              className={cn(
                'grid min-w-0 gap-2 rounded-[1.1rem] border px-3 py-2.5 text-sm font-medium text-[var(--color-ink)]',
                summary.discountCode
                  ? 'border-emerald-400/25 bg-emerald-950/15'
                  : discountInvalid
                    ? 'border-red-400/25 bg-red-950/15'
                    : 'border-[var(--color-border)] bg-[var(--color-paper-2)]',
              )}
            >
              <span>{t('booking.discountCode')}</span>
              <input
                className="field min-h-11 uppercase"
                autoComplete="off"
                placeholder={t('booking.discountCodePlaceholder')}
                {...register('discountCode')}
              />
              <FieldError message={errors.discountCode?.message} />
            </label>
            {discountStatus ? (
              <p
                className={cn(
                  'mt-2 rounded-[1rem] border px-3 py-2 text-xs font-medium leading-5 xl:absolute xl:left-0 xl:right-0 xl:top-full xl:z-10',
                  discountInvalid
                    ? 'border-red-400/25 bg-red-950/90 text-red-100'
                    : 'border-emerald-400/20 bg-emerald-950/90 text-emerald-100',
                )}
              >
                {discountStatus}
              </p>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  )
}
