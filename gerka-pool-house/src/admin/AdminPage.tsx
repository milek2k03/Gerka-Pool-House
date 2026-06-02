import {
  BadgeDollarSign,
  BookOpen,
  CalendarOff,
  Download,
  FileText,
  GalleryHorizontalEnd,
  HelpCircle,
  Inbox,
  LogOut,
  MapPin,
  Settings,
  Sparkles,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Logo } from '../components/common/Logo'
import { Seo } from '../components/common/Seo'
import { Button } from '../components/ui/Button'
import { supportedLocales } from '../config/site'
import { useAdminAuth } from '../hooks/useAdminAuth'
import { useSiteContent } from '../hooks/useSiteContent'
import { reservationRepository } from '../services/reservationRepository'
import type { Locale, LocalizedString } from '../types/common'
import type { IconKey, SiteContent } from '../types/content'
import type { AvailabilityRange, ReservationRequest, ReservationStatus } from '../types/booking'
import { formatDate, formatMoney } from '../utils/format'
import { getLocale, localize } from '../utils/locale'
import { cn } from '../utils/cn'
import { addDays, getTomorrowISO, toDate, toISODate } from '../utils/date'
import {
  createReservationExportFilename,
  createSingleReservationExportFilename,
  downloadReservationsForExcel,
} from '../utils/reservationExport'
import { GalleryItemMediaPicker } from './GalleryItemMediaPicker'
import { AdminLogin } from './AdminLogin'

type TabId =
  | 'instructions'
  | 'content'
  | 'gallery'
  | 'pricing'
  | 'availability'
  | 'faq'
  | 'amenities'
  | 'contact'
  | 'seo'
  | 'reservations'

type ReservationSortOption = 'newest' | 'oldest' | 'checkInAsc' | 'checkInDesc' | 'priceDesc' | 'priceAsc'
type ReservationStatusFilter = ReservationStatus | 'all'
type AdminNotice = 'saved' | 'restored' | null
type ReservationAcceptanceConflict =
  | { type: 'reservation'; reservation: ReservationRequest }
  | { type: 'availability'; range: AvailabilityRange }

const iconOptions: IconKey[] = [
  'pool',
  'grill',
  'garden',
  'parking',
  'wifi',
  'relax',
  'lake',
  'route',
  'restaurant',
  'landmark',
]

const reservationStatuses: ReservationStatus[] = ['pending', 'accepted', 'rejected', 'cancelled']
const instructionSectionIds = [
  'start',
  'save',
  'reservations',
  'availability',
  'gallery',
  'pricing',
  'content',
  'integrations',
] as const
const instructionStepIds = ['step1', 'step2', 'step3'] as const

function getReservationStatusDotClass(status: ReservationStatus) {
  switch (status) {
    case 'accepted':
      return 'bg-emerald-400 ring-emerald-300/35'
    case 'rejected':
      return 'bg-red-500 ring-red-300/35'
    case 'cancelled':
      return 'bg-zinc-400 ring-zinc-300/35'
    case 'pending':
    default:
      return 'bg-amber-400 ring-amber-300/35'
  }
}

function TextInput({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string | number
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
      {label}
      <input className="field" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function TextAreaInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
      {label}
      <textarea className="field min-h-28 resize-y" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function ReservationDetailRow({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="grid gap-1 border-b border-[var(--color-border)] px-4 py-3 last:border-b-0 sm:grid-cols-[150px_1fr] sm:gap-4">
      <dt className="text-sm font-medium text-[var(--color-muted)]">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-semibold leading-6 text-[var(--color-ink)]">{value}</dd>
    </div>
  )
}

function LocalizedField({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string
  value: LocalizedString
  onChange: (locale: Locale, value: string) => void
  textarea?: boolean
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {supportedLocales.map((locale) =>
        textarea ? (
          <TextAreaInput
            key={locale}
            label={`${label} ${locale.toUpperCase()}`}
            value={value[locale]}
            onChange={(next) => onChange(locale, next)}
          />
        ) : (
          <TextInput
            key={locale}
            label={`${label} ${locale.toUpperCase()}`}
            value={value[locale]}
            onChange={(next) => onChange(locale, next)}
          />
        ),
      )}
    </div>
  )
}

function numberValue(event: ChangeEvent<HTMLInputElement>) {
  return Number(event.target.value || 0)
}

function nextDayISO(date: string) {
  if (!date) return getTomorrowISO()

  return toISODate(addDays(toDate(date), 1))
}

function previousDayISO(date: string) {
  if (!date) return getTomorrowISO()

  return toISODate(addDays(toDate(date), -1))
}

function getInclusiveUnavailableEnd(range: AvailabilityRange) {
  if (!range.to || range.to <= range.from) return range.from

  return previousDayISO(range.to)
}

function getExclusiveUnavailableEnd(inclusiveEnd: string, from: string) {
  const safeInclusiveEnd = !inclusiveEnd || inclusiveEnd < from ? from : inclusiveEnd

  return nextDayISO(safeInclusiveEnd)
}

function createUnavailableRange(): AvailabilityRange {
  const from = getTomorrowISO()

  return {
    id: crypto.randomUUID(),
    from,
    to: nextDayISO(from),
    status: 'unavailable',
  }
}

function matchesReservationQuery(reservation: ReservationRequest, query: string) {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) return true

  return (reservation.reservationNumber || reservation.id).toLowerCase().includes(normalizedQuery)
}

function sortReservations(reservations: ReservationRequest[], sortBy: ReservationSortOption) {
  return [...reservations].sort((first, second) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime()
      case 'checkInAsc':
        return first.checkIn.localeCompare(second.checkIn)
      case 'checkInDesc':
        return second.checkIn.localeCompare(first.checkIn)
      case 'priceDesc':
        return second.estimatedTotal - first.estimatedTotal
      case 'priceAsc':
        return first.estimatedTotal - second.estimatedTotal
      case 'newest':
      default:
        return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
    }
  })
}

function rangesOverlap(firstFrom: string, firstTo: string, secondFrom: string, secondTo: string) {
  return firstFrom < secondTo && firstTo > secondFrom
}

function findReservationAcceptanceConflict(
  reservation: ReservationRequest,
  reservations: ReservationRequest[],
  availability: AvailabilityRange[],
): ReservationAcceptanceConflict | null {
  const conflictingReservation = reservations.find(
    (item) =>
      item.id !== reservation.id &&
      item.status === 'accepted' &&
      rangesOverlap(reservation.checkIn, reservation.checkOut, item.checkIn, item.checkOut),
  )

  if (conflictingReservation) {
    return { type: 'reservation', reservation: conflictingReservation }
  }

  const conflictingRange = availability.find((range) =>
    rangesOverlap(reservation.checkIn, reservation.checkOut, range.from, range.to),
  )

  if (conflictingRange) {
    return { type: 'availability', range: conflictingRange }
  }

  return null
}

export function AdminPage() {
  const adminAuth = useAdminAuth()
  const { content, saveContent, resetContent } = useSiteContent()
  const { t, i18n } = useTranslation()
  const locale = getLocale(i18n.language)
  const [activeTab, setActiveTab] = useState<TabId>('content')
  const [draft, setDraft] = useState<SiteContent>(content)
  const [isDraftDirty, setIsDraftDirty] = useState(false)
  const [notice, setNotice] = useState<AdminNotice>(null)
  const [contentActionError, setContentActionError] = useState('')
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
  const [reservations, setReservations] = useState<ReservationRequest[]>([])
  const [reservationsLoading, setReservationsLoading] = useState(false)
  const [reservationsError, setReservationsError] = useState('')
  const [reservationSearch, setReservationSearch] = useState('')
  const [reservationSort, setReservationSort] = useState<ReservationSortOption>('newest')
  const [reservationStatusFilter, setReservationStatusFilter] = useState<ReservationStatusFilter>('all')
  const [reservationStatusError, setReservationStatusError] = useState('')
  const [reservationConflictMessage, setReservationConflictMessage] = useState('')

  const tabs = useMemo(
    () => [
      { id: 'instructions' as const, label: t('admin.tabs.instructions'), icon: BookOpen },
      { id: 'content' as const, label: t('admin.tabs.content'), icon: FileText },
      { id: 'gallery' as const, label: t('admin.tabs.gallery'), icon: GalleryHorizontalEnd },
      { id: 'pricing' as const, label: t('admin.tabs.pricing'), icon: BadgeDollarSign },
      { id: 'availability' as const, label: t('admin.tabs.availability'), icon: CalendarOff },
      { id: 'faq' as const, label: t('admin.tabs.faq'), icon: HelpCircle },
      { id: 'amenities' as const, label: t('admin.tabs.amenities'), icon: Sparkles },
      { id: 'contact' as const, label: t('admin.tabs.contact'), icon: MapPin },
      { id: 'seo' as const, label: t('admin.tabs.seo'), icon: Settings },
      { id: 'reservations' as const, label: t('admin.tabs.reservations'), icon: Inbox },
    ],
    [t],
  )

  const filteredReservations = useMemo(
    () => reservations.filter((reservation) => matchesReservationQuery(reservation, reservationSearch)),
    [reservations, reservationSearch],
  )

  const groupedReservations = useMemo(() => {
    const scoped =
      reservationStatusFilter === 'all'
        ? filteredReservations
        : filteredReservations.filter((reservation) => reservation.status === reservationStatusFilter)

    return Object.fromEntries(
      reservationStatuses.map((status) => [
        status,
        sortReservations(
          scoped.filter((reservation) => reservation.status === status),
          reservationSort,
        ),
      ]),
    ) as Record<ReservationStatus, ReservationRequest[]>
  }, [filteredReservations, reservationSort, reservationStatusFilter])

  const reservationStatusCounts = useMemo(
    () =>
      Object.fromEntries(
        reservationStatuses.map((status) => [
          status,
          filteredReservations.filter((reservation) => reservation.status === status).length,
        ]),
      ) as Record<ReservationStatus, number>,
    [filteredReservations],
  )

  const visibleReservationsCount = useMemo(
    () => reservationStatuses.reduce((count, status) => count + groupedReservations[status].length, 0),
    [groupedReservations],
  )

  const visibleReservationStatuses = reservationStatusFilter === 'all' ? reservationStatuses : [reservationStatusFilter]

  const instructionSections = useMemo(
    () =>
      instructionSectionIds.map((sectionId) => ({
        id: sectionId,
        title: t(`admin.instructions.sections.${sectionId}.title`),
        steps: instructionStepIds.map((stepId) => t(`admin.instructions.sections.${sectionId}.${stepId}`)),
      })),
    [t],
  )

  useEffect(() => {
    if (adminAuth.status !== 'authenticated') return undefined

    let active = true

    const loadReservations = async () => {
      setReservationsLoading(true)
      setReservationsError('')

      try {
        const nextReservations = await reservationRepository.list()

        if (active) {
          setReservations(nextReservations)
        }
      } catch {
        if (active) {
          setReservationsError(t('admin.reservationsLoadFailed'))
        }
      } finally {
        if (active) {
          setReservationsLoading(false)
        }
      }
    }

    void loadReservations()
    const unsubscribe = reservationRepository.subscribe(loadReservations)

    return () => {
      active = false
      unsubscribe()
    }
  }, [adminAuth.status, t])

  if (!isDraftDirty && draft.updatedAt !== content.updatedAt) {
    setDraft(content)
  }

  const mutate = (updater: (next: SiteContent) => void) => {
    setDraft((current) => {
      const next = structuredClone(current)
      updater(next)
      return next
    })
    setIsDraftDirty(true)
    setNotice(null)
    setContentActionError('')
  }

  const save = async () => {
    setContentActionError('')

    try {
      const savedContent = await saveContent(draft)

      setDraft(savedContent)
      setIsDraftDirty(false)
      setNotice('saved')
    } catch {
      setContentActionError(t('admin.contentSaveFailed'))
    }
  }

  const reset = async () => {
    setContentActionError('')

    try {
      const restored = await resetContent()

      setDraft(restored)
      setIsDraftDirty(false)
      setNotice('restored')
      setIsResetConfirmOpen(false)
    } catch {
      setContentActionError(t('admin.contentResetFailed'))
      setIsResetConfirmOpen(false)
    }
  }

  const updateReservationStatus = async (id: string, status: ReservationStatus) => {
    setReservationStatusError('')
    setReservationConflictMessage('')
    const reservation = reservations.find((item) => item.id === id)

    if (!reservation) return

    if (status === 'accepted') {
      const conflict = findReservationAcceptanceConflict(reservation, reservations, draft.availability)

      if (conflict?.type === 'reservation') {
        setReservationConflictMessage(
          t('admin.reservationAcceptConflictReservation', {
            reservationNumber: conflict.reservation.reservationNumber || conflict.reservation.id,
            checkIn: formatDate(conflict.reservation.checkIn, locale),
            checkOut: formatDate(conflict.reservation.checkOut, locale),
          }),
        )
        return
      }

      if (conflict?.type === 'availability') {
        setReservationConflictMessage(
          t('admin.reservationAcceptConflictAvailability', {
            from: formatDate(conflict.range.from, locale),
            to: formatDate(getInclusiveUnavailableEnd(conflict.range), locale),
          }),
        )
        return
      }
    }

    try {
      setReservations(await reservationRepository.updateStatus(id, status))
    } catch {
      setReservationStatusError(t('admin.reservationStatusUpdateFailed'))
    }
  }

  const exportReservations = (items: ReservationRequest[], filename: string) => {
    downloadReservationsForExcel({
      filename,
      getStatusLabel: (status) => t(`admin.status.${status}`),
      locale,
      reservations: items,
    })
  }

  const exportAllReservations = () => {
    exportReservations(
      sortReservations(reservations, reservationSort),
      createReservationExportFilename(locale === 'pl' ? 'wszystkie' : 'all', locale),
    )
  }

  const exportStatusReservations = (status: ReservationStatus) => {
    exportReservations(
      sortReservations(
        reservations.filter((reservation) => reservation.status === status),
        reservationSort,
      ),
      createReservationExportFilename(t(`admin.status.${status}`), locale),
    )
  }

  const exportSingleReservation = (reservation: ReservationRequest) => {
    exportReservations([reservation], createSingleReservationExportFilename(reservation, locale))
  }

  if (adminAuth.status === 'loading') {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--color-paper)] px-5 text-center">
        <div>
          <Logo />
          <p className="mt-4 text-sm text-[var(--color-muted)]">{t('admin.auth.checkingSession')}</p>
        </div>
      </main>
    )
  }

  if (adminAuth.status !== 'authenticated') {
    return <AdminLogin isConfigured={adminAuth.status !== 'unconfigured'} onSignIn={adminAuth.signIn} />
  }

  return (
    <>
      <Seo settings={draft.seo.admin} locale={locale} noindex />
      <main className="min-h-screen bg-[var(--color-paper)]">
        <header className="border-b border-[var(--color-border)] bg-[var(--color-deep)] px-5 py-4 text-white">
          <div className="mx-auto grid max-w-7xl gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
            <div className="flex min-w-0 items-center justify-between gap-4">
              <Logo />
              <Link className="rounded-md px-3 py-2 text-sm font-medium text-white/76 hover:text-white xl:hidden" to="/">
                {draft.brandName}
              </Link>
            </div>

            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="flex flex-wrap items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] p-1.5">
                <span className="max-w-full truncate rounded-sm bg-[var(--color-surface)] px-3 py-2 text-sm text-white/76 sm:max-w-72">
                  {adminAuth.session?.user.email}
                </span>
                <Link className="hidden rounded-sm px-3 py-2 text-sm font-medium text-white/76 hover:bg-white/8 hover:text-white xl:inline-flex" to="/">
                  {draft.brandName}
                </Link>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                  onClick={adminAuth.signOut}
                >
                  <LogOut aria-hidden="true" className="size-4" />
                  {t('admin.auth.signOut')}
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] p-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    void save()
                  }}
                >
                  {t('common.save')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                  onClick={() => setIsResetConfirmOpen(true)}
                >
                  {t('common.reset')}
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3 lg:sticky lg:top-6 lg:self-start">
            <h1 className="px-3 py-2 text-xl font-semibold text-[var(--color-ink)]">{t('admin.title')}</h1>
            <p className="px-3 pb-3 text-sm leading-6 text-[var(--color-muted)]">{t('admin.subtitle')}</p>
            <nav className="grid gap-1" aria-label={t('admin.title')}>
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-water)]',
                      activeTab === tab.id
                        ? 'bg-[var(--color-brass)] text-[var(--color-deep)]'
                        : 'text-[var(--color-muted)] hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)]',
                    )}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
            {notice ? (
              <p
                className={cn(
                  'mt-3 rounded-md p-3 text-sm',
                  notice === 'saved' ? 'bg-emerald-950/40 text-emerald-200' : 'bg-amber-950/35 text-amber-100',
                )}
              >
                {notice === 'saved' ? t('admin.saved') : t('admin.restored')}
              </p>
            ) : null}
            {contentActionError ? (
              <p className="mt-3 rounded-md border border-red-400/25 bg-red-950/35 p-3 text-sm leading-6 text-red-100">
                {contentActionError}
              </p>
            ) : null}
          </aside>

          <section className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6">
            {activeTab === 'instructions' ? (
              <div className="grid gap-5">
                <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-paper)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-brass)]">
                    {t('admin.instructions.eyebrow')}
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-[var(--color-ink)] sm:text-3xl">
                    {t('admin.instructions.title')}
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--color-muted)] sm:text-base">
                    {t('admin.instructions.lead')}
                  </p>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  {instructionSections.map((section, sectionIndex) => (
                    <article
                      key={section.id}
                      className="rounded-md border border-[var(--color-border)] bg-[var(--color-paper)] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[var(--color-brass)] text-sm font-bold text-[var(--color-deep)]">
                          {sectionIndex + 1}
                        </span>
                        <h3 className="pt-1 text-lg font-semibold text-[var(--color-ink)]">{section.title}</h3>
                      </div>
                      <ol className="mt-4 grid gap-3">
                        {section.steps.map((step, stepIndex) => (
                          <li key={step} className="grid grid-cols-[auto_1fr] gap-3">
                            <span className="mt-0.5 grid size-6 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-brass)]">
                              {stepIndex + 1}
                            </span>
                            <p className="text-sm leading-6 text-[var(--color-muted)]">{step}</p>
                          </li>
                        ))}
                      </ol>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {activeTab === 'content' ? (
              <div className="grid gap-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextInput
                    label={t('admin.fields.brandName')}
                    value={draft.brandName}
                    onChange={(value) => mutate((next) => void (next.brandName = value))}
                  />
                  <TextInput
                    label={t('admin.fields.logoText')}
                    value={draft.logoText}
                    onChange={(value) => mutate((next) => void (next.logoText = value))}
                  />
                </div>
                <LocalizedField
                  label={t('admin.fields.heroSlogan')}
                  value={draft.hero.slogan}
                  onChange={(language, value) => mutate((next) => void (next.hero.slogan[language] = value))}
                />
                <LocalizedField
                  label={t('admin.fields.heroLead')}
                  value={draft.hero.lead}
                  textarea
                  onChange={(language, value) => mutate((next) => void (next.hero.lead[language] = value))}
                />
                <LocalizedField
                  label={t('admin.fields.aboutTitle')}
                  value={draft.about.title}
                  onChange={(language, value) => mutate((next) => void (next.about.title[language] = value))}
                />
                <LocalizedField
                  label={t('admin.fields.aboutLead')}
                  value={draft.about.lead}
                  textarea
                  onChange={(language, value) => mutate((next) => void (next.about.lead[language] = value))}
                />
                <LocalizedField
                  label={t('admin.fields.aboutBody')}
                  value={draft.about.body}
                  textarea
                  onChange={(language, value) => mutate((next) => void (next.about.body[language] = value))}
                />
                <LocalizedField
                  label={t('sections.areaEyebrow')}
                  value={draft.area.title}
                  onChange={(language, value) => mutate((next) => void (next.area.title[language] = value))}
                />
                <LocalizedField
                  label={t('sections.bookingEyebrow')}
                  value={draft.booking.title}
                  onChange={(language, value) => mutate((next) => void (next.booking.title[language] = value))}
                />
              </div>
            ) : null}

            {activeTab === 'gallery' ? (
              <div className="grid gap-5">
                {draft.gallery.map((item, index) => (
                  <article key={item.id} className="grid gap-4 rounded-md border border-[var(--color-border)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-lg font-semibold text-[var(--color-ink)]">{localize(item.title, locale)}</h2>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        onClick={() => mutate((next) => void next.gallery.splice(index, 1))}
                      >
                        {t('common.remove')}
                      </Button>
                    </div>
                    <LocalizedField
                      label={t('admin.fields.title')}
                      value={item.title}
                      onChange={(language, value) =>
                        mutate((next) => void (next.gallery[index].title[language] = value))
                      }
                    />
                    <LocalizedField
                      label={t('admin.fields.alt')}
                      value={item.alt}
                      onChange={(language, value) => mutate((next) => void (next.gallery[index].alt[language] = value))}
                    />
                    <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                      <div className="grid gap-3">
                        <TextInput
                          label={t('admin.fields.mediaUrl')}
                          value={item.image.src}
                          onChange={(value) => mutate((next) => void (next.gallery[index].image.src = value))}
                        />
                        <GalleryItemMediaPicker
                          onUploaded={(upload) =>
                            mutate((next) => {
                              next.gallery[index].image = upload.asset
                            })
                          }
                        />
                      </div>
                      <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
                        {t('admin.fields.mediaType')}
                        <select
                          className="field"
                          value={item.image.type ?? 'image'}
                          onChange={(event) =>
                            mutate(
                              (next) =>
                                void (next.gallery[index].image.type = event.target.value as 'image' | 'video'),
                            )
                          }
                        >
                          <option value="image">{t('admin.mediaTypeImage')}</option>
                          <option value="video">{t('admin.mediaTypeVideo')}</option>
                        </select>
                      </label>
                    </div>
                  </article>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    mutate((next) =>
                      void next.gallery.push({
                        id: crypto.randomUUID(),
                        title: { pl: 'Materiał z galerii', en: 'Gallery media' },
                        alt: { pl: 'Materiał prezentujący Gerka Pool House', en: 'Media showing Gerka Pool House' },
                        image: { src: next.hero.image.src, type: 'image' },
                      }),
                    )
                  }
                >
                  {t('common.add')}
                </Button>
              </div>
            ) : null}

            {activeTab === 'pricing' ? (
              <div className="grid gap-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
                    {t('admin.fields.room1Price')}
                    <input
                      className="field"
                      type="number"
                      min={0}
                      value={draft.pricing.room1Nightly}
                      onChange={(event) => mutate((next) => void (next.pricing.room1Nightly = numberValue(event)))}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
                    {t('admin.fields.room2Price')}
                    <input
                      className="field"
                      type="number"
                      min={0}
                      value={draft.pricing.room2Nightly}
                      onChange={(event) => mutate((next) => void (next.pricing.room2Nightly = numberValue(event)))}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
                    {t('admin.fields.maxGuests')}
                    <input
                      className="field"
                      type="number"
                      min={1}
                      value={draft.pricing.maxGuests}
                      onChange={(event) => mutate((next) => void (next.pricing.maxGuests = numberValue(event)))}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
                    {t('admin.fields.minStay')}
                    <input
                      className="field"
                      type="number"
                      min={1}
                      value={draft.pricing.minStayNights}
                      onChange={(event) => mutate((next) => void (next.pricing.minStayNights = numberValue(event)))}
                    />
                  </label>
                </div>
                <LocalizedField
                  label={t('admin.fields.extraInfo')}
                  value={draft.pricing.extraInfo}
                  textarea
                  onChange={(language, value) => mutate((next) => void (next.pricing.extraInfo[language] = value))}
                />
                <p className="rounded-md bg-[var(--color-paper)] p-4 text-sm text-[var(--color-muted)]">
                  8 osób: {formatMoney(draft.pricing.room1Nightly + draft.pricing.room2Nightly, locale)}
                </p>
              </div>
            ) : null}

            {activeTab === 'availability' ? (
              <div className="grid gap-5">
                {draft.availability.length === 0 ? (
                  <p className="rounded-md bg-[var(--color-paper)] p-4 text-sm text-[var(--color-muted)]">
                    {t('admin.fields.availabilityEmpty')}
                  </p>
                ) : null}
                {draft.availability.map((range, index) => (
                  <article key={range.id} className="grid gap-4 rounded-md border border-[var(--color-border)] p-4">
                    <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                      <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
                        {t('admin.fields.unavailableFrom')}
                        <input
                          className="field"
                          type="date"
                          min={getTomorrowISO()}
                          value={range.from}
                          onChange={(event) =>
                            mutate((next) => {
                              const item = next.availability[index]
                              const currentInclusiveEnd = getInclusiveUnavailableEnd(item)
                              item.from = event.target.value
                              item.status = 'unavailable'
                              item.to = getExclusiveUnavailableEnd(currentInclusiveEnd, item.from)
                            })
                          }
                        />
                      </label>
                      <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
                        {t('admin.fields.unavailableTo')}
                        <input
                          className="field"
                          type="date"
                          min={range.from}
                          value={getInclusiveUnavailableEnd(range)}
                          onChange={(event) =>
                            mutate((next) => {
                              const item = next.availability[index]
                              item.to = getExclusiveUnavailableEnd(event.target.value, item.from)
                              item.status = 'unavailable'
                            })
                          }
                        />
                      </label>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        onClick={() => mutate((next) => void next.availability.splice(index, 1))}
                      >
                        {t('common.remove')}
                      </Button>
                    </div>
                    <p className="text-sm font-medium text-[var(--color-muted)]">
                      {t('booking.unavailable')}: {range.from} - {getInclusiveUnavailableEnd(range)}
                    </p>
                  </article>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => mutate((next) => void next.availability.push(createUnavailableRange()))}
                >
                  {t('admin.fields.addUnavailableRange')}
                </Button>
              </div>
            ) : null}

            {activeTab === 'faq' ? (
              <div className="grid gap-5">
                {draft.faq.map((item, index) => (
                  <article key={item.id} className="grid gap-4 rounded-md border border-[var(--color-border)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-lg font-semibold text-[var(--color-ink)]">{localize(item.question, locale)}</h2>
                      <Button type="button" size="sm" variant="danger" onClick={() => mutate((next) => void next.faq.splice(index, 1))}>
                        {t('common.remove')}
                      </Button>
                    </div>
                    <LocalizedField
                      label={t('admin.fields.question')}
                      value={item.question}
                      onChange={(language, value) => mutate((next) => void (next.faq[index].question[language] = value))}
                    />
                    <LocalizedField
                      label={t('admin.fields.answer')}
                      value={item.answer}
                      textarea
                      onChange={(language, value) => mutate((next) => void (next.faq[index].answer[language] = value))}
                    />
                  </article>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    mutate((next) =>
                      void next.faq.push({
                        id: crypto.randomUUID(),
                        question: { pl: 'Nowe pytanie', en: 'New question' },
                        answer: { pl: 'Nowa odpowiedź', en: 'New answer' },
                      }),
                    )
                  }
                >
                  {t('common.add')}
                </Button>
              </div>
            ) : null}

            {activeTab === 'amenities' ? (
              <div className="grid gap-8">
                <div className="grid gap-5">
                  {draft.amenities.map((item, index) => (
                    <article key={item.id} className="grid gap-4 rounded-md border border-[var(--color-border)] p-4">
                      <div className="grid gap-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
                        <LocalizedField
                          label={t('admin.fields.title')}
                          value={item.title}
                          onChange={(language, value) =>
                            mutate((next) => void (next.amenities[index].title[language] = value))
                          }
                        />
                        <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
                          Ikona
                          <select
                            className="field"
                            value={item.icon}
                            onChange={(event) =>
                              mutate((next) => void (next.amenities[index].icon = event.target.value as IconKey))
                            }
                          >
                            {iconOptions.map((icon) => (
                              <option key={icon} value={icon}>
                                {icon}
                              </option>
                            ))}
                          </select>
                        </label>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          onClick={() => mutate((next) => void next.amenities.splice(index, 1))}
                        >
                          {t('common.remove')}
                        </Button>
                      </div>
                      <LocalizedField
                        label={t('admin.fields.description')}
                        value={item.description}
                        textarea
                        onChange={(language, value) =>
                          mutate((next) => void (next.amenities[index].description[language] = value))
                        }
                      />
                    </article>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      mutate((next) =>
                        void next.amenities.push({
                          id: crypto.randomUUID(),
                          icon: 'relax',
                          title: { pl: 'Nowa atrakcja', en: 'New amenity' },
                          description: { pl: 'Opis atrakcji', en: 'Amenity description' },
                        }),
                      )
                    }
                  >
                    {t('common.add')}
                  </Button>
                </div>
              </div>
            ) : null}

            {activeTab === 'contact' ? (
              <div className="grid gap-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextInput
                    label={t('admin.fields.phone')}
                    value={draft.contact.phone}
                    onChange={(value) => mutate((next) => void (next.contact.phone = value))}
                  />
                  <TextInput
                    label={t('admin.fields.email')}
                    value={draft.contact.email}
                    onChange={(value) => mutate((next) => void (next.contact.email = value))}
                  />
                  <TextInput
                    label={t('admin.fields.ownerEmail')}
                    value={draft.booking.ownerEmail}
                    onChange={(value) => mutate((next) => void (next.booking.ownerEmail = value))}
                  />
                  <TextInput
                    label={t('admin.fields.map')}
                    value={draft.contact.mapEmbedUrl}
                    onChange={(value) => mutate((next) => void (next.contact.mapEmbedUrl = value))}
                  />
                  <TextInput
                    label="Facebook URL"
                    value={draft.contact.facebookUrl}
                    onChange={(value) => mutate((next) => void (next.contact.facebookUrl = value))}
                  />
                  <TextInput
                    label="Instagram URL"
                    value={draft.contact.instagramUrl}
                    onChange={(value) => mutate((next) => void (next.contact.instagramUrl = value))}
                  />
                </div>
                <LocalizedField
                  label={t('admin.fields.address')}
                  value={draft.contact.address}
                  onChange={(language, value) => mutate((next) => void (next.contact.address[language] = value))}
                />
              </div>
            ) : null}

            {activeTab === 'seo' ? (
              <div className="grid gap-5">
                {Object.entries(draft.seo).map(([pageKey, settings]) => (
                  <article key={pageKey} className="grid gap-4 rounded-md border border-[var(--color-border)] p-4">
                    <h2 className="text-lg font-semibold capitalize text-[var(--color-ink)]">{pageKey}</h2>
                    <LocalizedField
                      label={t('admin.fields.metaTitle')}
                      value={settings.title}
                      onChange={(language, value) =>
                        mutate((next) => void (next.seo[pageKey as keyof SiteContent['seo']].title[language] = value))
                      }
                    />
                    <LocalizedField
                      label={t('admin.fields.metaDescription')}
                      value={settings.description}
                      textarea
                      onChange={(language, value) =>
                        mutate(
                          (next) => void (next.seo[pageKey as keyof SiteContent['seo']].description[language] = value),
                        )
                      }
                    />
                    <TextInput
                      label={t('admin.fields.canonical')}
                      value={settings.canonicalPath}
                      onChange={(value) =>
                        mutate((next) => void (next.seo[pageKey as keyof SiteContent['seo']].canonicalPath = value))
                      }
                    />
                  </article>
                ))}
              </div>
            ) : null}

            {activeTab === 'reservations' ? (
              <div className="grid gap-5">
                <div className="flex flex-wrap gap-2" aria-label={t('admin.reservationCategories')}>
                  <button
                    type="button"
                    className={cn(
                      'rounded-md border px-3 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-water)]',
                      reservationStatusFilter === 'all'
                        ? 'border-[var(--color-brass)] bg-[var(--color-brass)] text-[var(--color-deep)]'
                        : 'border-[var(--color-border)] bg-[var(--color-paper)] text-[var(--color-muted)] hover:text-[var(--color-ink)]',
                    )}
                    onClick={() => setReservationStatusFilter('all')}
                  >
                    {t('admin.reservationStatusAll')} <span className="ml-2">{filteredReservations.length}</span>
                  </button>
                  {reservationStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={cn(
                        'inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-water)]',
                        reservationStatusFilter === status
                          ? 'border-[var(--color-brass)] bg-[var(--color-brass)] text-[var(--color-deep)]'
                          : 'border-[var(--color-border)] bg-[var(--color-paper)] text-[var(--color-muted)] hover:text-[var(--color-ink)]',
                      )}
                      onClick={() => setReservationStatusFilter(status)}
                    >
                      <span
                        aria-hidden="true"
                        className={cn('size-2.5 rounded-full ring-4', getReservationStatusDotClass(status))}
                      />
                      {t(`admin.status.${status}`)}
                      <span>{reservationStatusCounts[status]}</span>
                    </button>
                  ))}
                </div>
                {reservationStatusError ? (
                  <p
                    className="rounded-md border border-red-400/25 bg-red-950/35 p-4 text-sm leading-6 text-red-100"
                    role="alert"
                  >
                    {reservationStatusError}
                  </p>
                ) : null}
                <div className="grid gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-paper)] p-4">
                  <div>
                    <h2 className="text-base font-semibold text-[var(--color-ink)]">{t('admin.exportTitle')}</h2>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{t('admin.exportLead')}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={reservations.length === 0}
                      onClick={exportAllReservations}
                    >
                      <Download aria-hidden="true" className="size-4" />
                      {t('admin.exportAllReservations')}
                    </Button>
                    {reservationStatuses.map((status) => {
                      const statusCount = reservations.filter((reservation) => reservation.status === status).length

                      return (
                        <Button
                          key={status}
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={statusCount === 0}
                          onClick={() => exportStatusReservations(status)}
                        >
                          <Download aria-hidden="true" className="size-4" />
                          {t('admin.exportStatusReservations', {
                            status: t(`admin.status.${status}`),
                            count: statusCount,
                          })}
                        </Button>
                      )
                    })}
                  </div>
                </div>
                <div className="grid gap-4 rounded-md border border-[var(--color-border)] bg-[var(--color-paper)] p-4 lg:grid-cols-[1fr_260px]">
                  <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
                    {t('admin.reservationSearch')}
                    <input
                      className="field"
                      type="search"
                      value={reservationSearch}
                      placeholder={t('admin.reservationSearchPlaceholder')}
                      onChange={(event) => setReservationSearch(event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
                    {t('admin.reservationSort')}
                    <select
                      className="field"
                      value={reservationSort}
                      onChange={(event) => setReservationSort(event.target.value as ReservationSortOption)}
                    >
                      <option value="newest">{t('admin.sort.newest')}</option>
                      <option value="oldest">{t('admin.sort.oldest')}</option>
                      <option value="checkInAsc">{t('admin.sort.checkInAsc')}</option>
                      <option value="checkInDesc">{t('admin.sort.checkInDesc')}</option>
                      <option value="priceDesc">{t('admin.sort.priceDesc')}</option>
                      <option value="priceAsc">{t('admin.sort.priceAsc')}</option>
                    </select>
                  </label>
                </div>
                {reservationsLoading ? (
                  <p className="rounded-md bg-[var(--color-paper)] p-4 text-sm text-[var(--color-muted)]">
                    {t('admin.reservationsLoading')}
                  </p>
                ) : reservationsError ? (
                  <p
                    className="rounded-md border border-red-400/25 bg-red-950/35 p-4 text-sm leading-6 text-red-100"
                    role="alert"
                  >
                    {reservationsError}
                  </p>
                ) : reservations.length === 0 ? (
                  <p className="rounded-md bg-[var(--color-paper)] p-4 text-sm text-[var(--color-muted)]">
                    {t('admin.reservationsEmpty')}
                  </p>
                ) : visibleReservationsCount === 0 ? (
                  <p className="rounded-md bg-[var(--color-paper)] p-4 text-sm text-[var(--color-muted)]">
                    {t('admin.reservationsNoResults')}
                  </p>
                ) : (
                  visibleReservationStatuses.map((status) => {
                    const statusReservations = groupedReservations[status]

                    return (
                      <section
                        key={status}
                        className="grid gap-4 rounded-md border border-[var(--color-border)] bg-[var(--color-paper)] p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
                          <div className="flex items-center gap-2">
                            <span
                              aria-hidden="true"
                              className={cn('size-3 rounded-full ring-4', getReservationStatusDotClass(status))}
                            />
                            <h2 className="text-lg font-semibold text-[var(--color-ink)]">{t(`admin.status.${status}`)}</h2>
                          </div>
                          <span className="rounded-md bg-[var(--color-surface-2)] px-3 py-1 text-sm font-semibold text-[var(--color-ink)]">
                            {statusReservations.length}
                          </span>
                        </div>
                        {statusReservations.length === 0 ? (
                          <p className="rounded-md bg-[var(--color-paper)] p-4 text-sm text-[var(--color-muted)]">
                            {t('admin.reservationsStatusEmpty')}
                          </p>
                        ) : (
                          statusReservations.map((reservation) => (
                            <article
                              key={reservation.id}
                              className="relative overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]"
                            >
                              <span
                                aria-hidden="true"
                                className={cn(
                                  'absolute inset-y-0 left-0 w-1',
                                  getReservationStatusDotClass(reservation.status).split(' ')[0],
                                )}
                              />
                              <div className="grid gap-5 p-4 sm:p-5">
                                <div className="grid gap-4 lg:grid-cols-[1fr_190px] lg:items-start">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span
                                        aria-hidden="true"
                                        className={cn(
                                          'size-3 rounded-full ring-4',
                                          getReservationStatusDotClass(reservation.status),
                                        )}
                                      />
                                      <h3 className="text-lg font-semibold text-[var(--color-ink)]">
                                        {reservation.fullName}
                                      </h3>
                                    </div>
                                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-[var(--color-muted)]">
                                    <span className="rounded-md bg-[var(--color-deep)] px-2.5 py-1 font-mono text-xs text-[var(--color-ink)]">
                                      {reservation.reservationNumber || reservation.id}
                                    </span>
                                    <span className="rounded-md bg-[var(--color-deep)] px-2.5 py-1">
                                      {reservation.checkIn} - {reservation.checkOut}
                                    </span>
                                    <span className="rounded-md bg-[var(--color-deep)] px-2.5 py-1">
                                      {reservation.guests} {locale === 'pl' ? 'os.' : 'guests'}
                                    </span>
                                  </div>
                                  <p className="mt-3 text-xl font-semibold text-[var(--color-brass)]">
                                    {formatMoney(reservation.estimatedTotal, locale)}
                                  </p>
                                </div>
                                <div className="grid gap-3">
                                  <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
                                    {t('common.status')}
                                    <select
                                      className="field"
                                      value={reservation.status}
                                      onChange={(event) => {
                                        void updateReservationStatus(
                                          reservation.id,
                                          event.target.value as ReservationStatus,
                                        )
                                      }}
                                    >
                                      {reservationStatuses.map((nextStatus) => (
                                        <option key={nextStatus} value={nextStatus}>
                                          {t(`admin.status.${nextStatus}`)}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    className="w-full"
                                    onClick={() => exportSingleReservation(reservation)}
                                  >
                                    <Download aria-hidden="true" className="size-4" />
                                    {t('admin.exportSingleReservation')}
                                  </Button>
                                </div>
                              </div>
                              <dl className="overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-paper)]">
                                <ReservationDetailRow label={t('admin.reservationDetailEmail')} value={reservation.email} />
                                <ReservationDetailRow label={t('admin.reservationDetailPhone')} value={reservation.phone} />
                                <ReservationDetailRow label={t('admin.reservationDetailNights')} value={reservation.nights} />
                                <ReservationDetailRow label={t('admin.reservationDetailRooms')} value={reservation.roomsUsed} />
                                <ReservationDetailRow
                                  label={t('admin.reservationDetailCreated')}
                                  value={new Date(reservation.createdAt).toLocaleString(locale)}
                                />
                              </dl>
                              {reservation.message ? (
                                <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-deep)] p-3">
                                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                                    {t('booking.message')}
                                  </p>
                                  <p className="mt-2 text-sm leading-6 text-[var(--color-ink)]">{reservation.message}</p>
                                </div>
                              ) : null}
                              </div>
                            </article>
                          ))
                        )}
                      </section>
                    )
                  })
                )}
              </div>
            ) : null}
          </section>
        </div>

        {isResetConfirmOpen ? (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-5 py-8"
            role="presentation"
            onClick={() => setIsResetConfirmOpen(false)}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="reset-confirm-title"
              className="w-full max-w-lg rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-brass)]">
                {t('admin.resetConfirm.eyebrow')}
              </p>
              <h2 id="reset-confirm-title" className="mt-3 text-2xl font-semibold text-[var(--color-ink)]">
                {t('admin.resetConfirm.title')}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{t('admin.resetConfirm.body')}</p>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={() => setIsResetConfirmOpen(false)}>
                  {t('admin.resetConfirm.cancel')}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => {
                    void reset()
                  }}
                >
                  {t('admin.resetConfirm.confirm')}
                </Button>
              </div>
            </section>
          </div>
        ) : null}

        {reservationConflictMessage ? (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-5 py-8"
            role="presentation"
            onClick={() => setReservationConflictMessage('')}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="reservation-conflict-title"
              className="w-full max-w-lg rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-brass)]">
                {t('admin.reservationConflictDialog.eyebrow')}
              </p>
              <h2 id="reservation-conflict-title" className="mt-3 text-2xl font-semibold text-[var(--color-ink)]">
                {t('admin.reservationConflictDialog.title')}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{reservationConflictMessage}</p>
              <div className="mt-6 flex justify-end">
                <Button type="button" variant="secondary" onClick={() => setReservationConflictMessage('')}>
                  {t('admin.reservationConflictDialog.close')}
                </Button>
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </>
  )
}
