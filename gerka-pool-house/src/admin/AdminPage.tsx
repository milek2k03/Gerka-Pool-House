import {
  BadgeDollarSign,
  BookOpen,
  CalendarOff,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Download,
  FileText,
  GalleryHorizontalEnd,
  GripVertical,
  HelpCircle,
  Inbox,
  LogOut,
  MapPin,
  Plus,
  RotateCcw,
  Save as SaveIcon,
  Settings,
  Sparkles,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Logo } from '../components/common/Logo'
import { ResponsiveImage } from '../components/common/ResponsiveImage'
import { Seo } from '../components/common/Seo'
import { Button } from '../components/ui/Button'
import { supportedLocales } from '../config/site'
import { useAdminAuth } from '../hooks/useAdminAuth'
import { useSiteContent } from '../hooks/useSiteContent'
import { contentRepository } from '../services/contentRepository'
import { reservationRepository } from '../services/reservationRepository'
import type { Locale, LocalizedString } from '../types/common'
import type {
  DiscountCode,
  DiscountCodeType,
  DiscountWeekday,
  IconKey,
  ImageAsset,
  SiteContent,
} from '../types/content'
import type {
  AvailabilityRange,
  AvailabilityStatus,
  ReservationRequest,
  ReservationStatus,
} from '../types/booking'
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
  | 'area'
  | 'contact'
  | 'seo'
  | 'reservations'

type ReservationSortOption = 'newest' | 'oldest' | 'checkInAsc' | 'checkInDesc' | 'priceDesc' | 'priceAsc'
type ReservationStatusFilter = ReservationStatus | 'all'
type AvailabilitySortOption = 'dateAsc' | 'dateDesc'
type AdminNotice = 'saved' | 'restored' | null
type GalleryDragState = { sectionIndex: number; itemId: string } | null
type GalleryDropTarget = { sectionIndex: number; itemId: string; position: 'before' | 'after' } | null
type ReservationAcceptanceConflict =
  | { type: 'reservation'; reservation: ReservationRequest }
  | { type: 'availability'; range: AvailabilityRange }

const iconOptions: IconKey[] = [
  'pool',
  'grill',
  'firepit',
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
const availabilityPageSize = 5
const discountWeekdays: DiscountWeekday[] = [1, 2, 3, 4, 5, 6, 7]
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

function MediaPreview({ image }: { image: ImageAsset }) {
  if (image.type === 'video') {
    return (
      <video
        className="aspect-video w-full rounded-md border border-[var(--color-border)] bg-[var(--color-deep)] object-cover"
        src={image.src}
        poster={image.poster}
        controls
        preload="metadata"
      />
    )
  }

  return (
    <ResponsiveImage
      image={image}
      alt=""
      className="aspect-video rounded-md border border-[var(--color-border)] bg-[var(--color-deep)]"
      imgClassName="object-cover"
    />
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

function discountCodeValue(value: string) {
  return value.trim().replace(/\s+/g, '').toUpperCase()
}

function discountPercentValue(event: ChangeEvent<HTMLInputElement>) {
  return Math.min(100, Math.max(1, Number(event.target.value || 1)))
}

function setDiscountType(discount: DiscountCode, type: DiscountCodeType) {
  discount.type = type

  if (type === 'permanent') {
    delete discount.validFrom
    delete discount.validTo
    delete discount.weekdays
    return
  }

  if (type === 'dateRange') {
    const defaultDate = getTomorrowISO()
    const validFrom = discount.validFrom || defaultDate
    discount.validFrom = validFrom
    discount.validTo =
      discount.validTo && discount.validTo >= validFrom
        ? discount.validTo
        : validFrom
    delete discount.weekdays
    return
  }

  discount.weekdays = discount.weekdays?.length ? discount.weekdays : [1, 2, 3, 4]
  delete discount.validFrom
  delete discount.validTo
}

function toggleDiscountWeekday(discount: DiscountCode, weekday: DiscountWeekday) {
  const weekdays = new Set(discount.weekdays ?? [])

  if (weekdays.has(weekday)) {
    weekdays.delete(weekday)
  } else {
    weekdays.add(weekday)
  }

  discount.weekdays = Array.from(weekdays).sort((left, right) => left - right)
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

function createAvailabilityRange(status: AvailabilityStatus): AvailabilityRange {
  const from = getTomorrowISO()

  return {
    id: crypto.randomUUID(),
    from,
    to: nextDayISO(from),
    status,
  }
}

function createGalleryItem(sourceImage: ImageAsset) {
  return {
    id: crypto.randomUUID(),
    title: { pl: 'Nowe zdjęcie', en: 'New photo' },
    alt: { pl: 'Zdjęcie prezentujące Gerka Pool House', en: 'Photo showing Gerka Pool House' },
    image: { ...sourceImage, type: sourceImage.type ?? 'image' },
  }
}

function createAreaInfoItem() {
  return {
    id: crypto.randomUUID(),
    title: { pl: 'Nowa pozycja', en: 'New item' },
    distance: { pl: 'odległość od obiektu', en: 'distance from the property' },
    description: { pl: 'Opis pozycji', en: 'Item description' },
    details: [],
  }
}

function createAreaPlace() {
  return {
    id: crypto.randomUUID(),
    icon: 'landmark' as IconKey,
    title: { pl: 'Nowe miejsce', en: 'New place' },
    distance: { pl: 'odległość od obiektu', en: 'distance from the property' },
    description: { pl: 'Opis miejsca', en: 'Place description' },
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
  const [draftOverride, setDraft] = useState<SiteContent>(content)
  const [isDraftDirty, setIsDraftDirty] = useState(false)
  const draft = isDraftDirty ? draftOverride : content
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
  const [availabilityPage, setAvailabilityPage] = useState(1)
  const [availabilitySort, setAvailabilitySort] = useState<AvailabilitySortOption>('dateAsc')
  const [showBookedAvailability, setShowBookedAvailability] = useState(true)
  const [showUnavailableAvailability, setShowUnavailableAvailability] = useState(true)
  const [draggedGalleryItem, setDraggedGalleryItem] = useState<GalleryDragState>(null)
  const [galleryDropTarget, setGalleryDropTarget] = useState<GalleryDropTarget>(null)
  const [openGallerySectionIds, setOpenGallerySectionIds] = useState<string[]>(() =>
    content.gallerySections.slice(0, 1).map((section) => section.id),
  )

  const tabs = useMemo(
    () => [
      { id: 'instructions' as const, label: t('admin.tabs.instructions'), icon: BookOpen },
      { id: 'content' as const, label: t('admin.tabs.content'), icon: FileText },
      { id: 'gallery' as const, label: t('admin.tabs.gallery'), icon: GalleryHorizontalEnd },
      { id: 'pricing' as const, label: t('admin.tabs.pricing'), icon: BadgeDollarSign },
      { id: 'availability' as const, label: t('admin.tabs.availability'), icon: CalendarOff },
      { id: 'faq' as const, label: t('admin.tabs.faq'), icon: HelpCircle },
      { id: 'amenities' as const, label: t('admin.tabs.amenities'), icon: Sparkles },
      { id: 'area' as const, label: t('admin.tabs.area'), icon: MapPin },
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
  const gallerySectionIds = useMemo(() => draft.gallerySections.map((section) => section.id), [draft.gallerySections])

  const filteredAvailability = useMemo(() => {
    const ranges = draft.availability
      .map((range, index) => ({ range, index }))
      .filter(({ range }) =>
        range.status === 'booked' ? showBookedAvailability : showUnavailableAvailability,
      )

    return ranges.sort((left, right) => {
      const result = left.range.from.localeCompare(right.range.from) || left.range.to.localeCompare(right.range.to)
      return availabilitySort === 'dateAsc' ? result : -result
    })
  }, [availabilitySort, draft.availability, showBookedAvailability, showUnavailableAvailability])

  const availabilityPageCount = Math.max(1, Math.ceil(filteredAvailability.length / availabilityPageSize))
  const currentAvailabilityPage = Math.min(availabilityPage, availabilityPageCount)
  const visibleAvailability = filteredAvailability.slice(
    (currentAvailabilityPage - 1) * availabilityPageSize,
    currentAvailabilityPage * availabilityPageSize,
  )

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
    const unsubscribe = reservationRepository.subscribe(loadReservations, {
      realtime: true,
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [adminAuth.status, t])

  useEffect(() => {
    if (adminAuth.status !== 'authenticated') return

    void contentRepository.cleanupExpiredAvailability().catch(() => undefined)
  }, [adminAuth.status])

  const toggleGallerySection = (sectionId: string) => {
    setOpenGallerySectionIds((current) =>
      current.includes(sectionId) ? current.filter((id) => id !== sectionId) : [...current, sectionId],
    )
  }

  const openGallerySectionAndScroll = (sectionId: string) => {
    setOpenGallerySectionIds((current) => (current.includes(sectionId) ? current : [...current, sectionId]))
    window.requestAnimationFrame(() => {
      document.getElementById(`admin-gallery-${sectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const mutate = (updater: (next: SiteContent) => void) => {
    setDraft((current) => {
      const next = structuredClone(isDraftDirty ? current : content)
      updater(next)
      return next
    })
    setIsDraftDirty(true)
    setNotice(null)
    setContentActionError('')
  }

  const moveGalleryItem = (sectionIndex: number, fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return

    mutate((next) => {
      const items = next.gallerySections[sectionIndex]?.items

      if (!items || fromIndex >= items.length || toIndex >= items.length) return

      const [movedItem] = items.splice(fromIndex, 1)
      items.splice(toIndex, 0, movedItem)
    })
  }

  const finishGalleryItemDrop = (sectionIndex: number, targetItemId: string, position: 'before' | 'after') => {
    if (!draggedGalleryItem || draggedGalleryItem.sectionIndex !== sectionIndex) return

    const items = draft.gallerySections[sectionIndex]?.items ?? []
    const fromIndex = items.findIndex((item) => item.id === draggedGalleryItem.itemId)
    const targetIndex = items.findIndex((item) => item.id === targetItemId)
    const insertionBoundary = targetIndex + (position === 'after' ? 1 : 0)
    const toIndex = fromIndex < insertionBoundary ? insertionBoundary - 1 : insertionBoundary

    moveGalleryItem(sectionIndex, fromIndex, toIndex)
    setDraggedGalleryItem(null)
    setGalleryDropTarget(null)
  }

  const handleGalleryItemDragStart = (
    event: DragEvent<HTMLButtonElement>,
    sectionIndex: number,
    itemId: string,
  ) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', itemId)
    setDraggedGalleryItem({ sectionIndex, itemId })
  }

  const handleGalleryItemDragOver = (
    event: DragEvent<HTMLDivElement>,
    sectionIndex: number,
    itemId: string,
  ) => {
    if (!draggedGalleryItem || draggedGalleryItem.sectionIndex !== sectionIndex) return

    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'

    if (draggedGalleryItem.itemId === itemId) {
      setGalleryDropTarget(null)
      return
    }

    const bounds = event.currentTarget.getBoundingClientRect()
    const position = event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after'

    setGalleryDropTarget({ sectionIndex, itemId, position })
  }

  const resetGalleryDrag = () => {
    setDraggedGalleryItem(null)
    setGalleryDropTarget(null)
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
      setOpenGallerySectionIds(restored.gallerySections.slice(0, 1).map((section) => section.id))
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
          <div className="mx-auto grid max-w-7xl gap-4">
            <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center justify-between gap-4">
                <Logo />
                <Link className="rounded-md px-3 py-2 text-sm font-medium text-white/76 hover:text-white lg:hidden" to="/">
                  {draft.brandName}
                </Link>
              </div>

              <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] p-1.5">
                <span className="max-w-full truncate rounded-sm bg-[var(--color-surface)] px-3 py-2 text-sm text-white/76 sm:max-w-72">
                  {adminAuth.session?.user.email}
                </span>
                <Link className="hidden rounded-sm px-3 py-2 text-sm font-medium text-white/76 hover:bg-white/8 hover:text-white lg:inline-flex" to="/">
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
            </div>

            <div className="grid gap-3 rounded-md border border-[var(--color-brass)]/30 bg-[var(--color-surface)]/55 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-ink)]">{t('admin.saveBarTitle')}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                  {isDraftDirty ? t('admin.unsavedChanges') : t('admin.allChangesSaved')}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  size="lg"
                  className="w-full shadow-lg shadow-black/20 sm:w-auto"
                  onClick={() => {
                    void save()
                  }}
                >
                  <SaveIcon aria-hidden="true" className="size-4" />
                  {t('admin.saveChanges')}
                </Button>
                <Button
                  type="button"
                  size="md"
                  variant="ghost"
                  className="w-full text-white hover:bg-white/10 sm:w-auto"
                  onClick={() => setIsResetConfirmOpen(true)}
                >
                  <RotateCcw aria-hidden="true" className="size-4" />
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
                <div className="grid gap-4 rounded-md border border-[var(--color-border)] bg-[var(--color-paper)] p-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                  <div className="grid gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--color-ink)]">
                        {t('admin.fields.heroImage')}
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                        {t('admin.fields.heroImageHelp')}
                      </p>
                    </div>
                    <TextInput
                      label={t('admin.fields.imageUrl')}
                      value={draft.hero.image.src}
                      onChange={(value) =>
                        mutate((next) => {
                          next.hero.image = { src: value, type: 'image' }
                        })
                      }
                    />
                    <GalleryItemMediaPicker
                      accept="image/*"
                      allowVideo={false}
                      unsupportedMessage={t('admin.mediaUploadImageUnsupported')}
                      onUploaded={(upload) =>
                        mutate((next) => {
                          next.hero.image = { ...upload.asset, type: 'image' }
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <p className="text-sm font-medium text-[var(--color-ink)]">{t('admin.fields.heroImagePreview')}</p>
                    <ResponsiveImage
                      image={draft.hero.image}
                      alt=""
                      className="aspect-[16/9] rounded-md border border-[var(--color-border)] bg-[var(--color-deep)]"
                      imgClassName="object-cover"
                    />
                  </div>
                </div>
                <div className="grid gap-4 rounded-md border border-[var(--color-border)] bg-[var(--color-paper)] p-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                  <div className="grid gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--color-ink)]">
                        {t('admin.fields.heroMobileImage')}
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                        {t('admin.fields.heroMobileImageHelp')}
                      </p>
                    </div>
                    <TextInput
                      label={t('admin.fields.imageUrl')}
                      value={(draft.hero.mobileImage ?? draft.hero.image).src}
                      onChange={(value) =>
                        mutate((next) => {
                          next.hero.mobileImage = { src: value, type: 'image' }
                        })
                      }
                    />
                    <GalleryItemMediaPicker
                      accept="image/*"
                      allowVideo={false}
                      unsupportedMessage={t('admin.mediaUploadImageUnsupported')}
                      onUploaded={(upload) =>
                        mutate((next) => {
                          next.hero.mobileImage = { ...upload.asset, type: 'image' }
                        })
                      }
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="justify-self-start"
                      onClick={() =>
                        mutate((next) => {
                          next.hero.mobileImage = next.hero.image
                        })
                      }
                    >
                      {t('admin.fields.heroMobileImageUseDesktop')}
                    </Button>
                  </div>
                  <div className="grid gap-2">
                    <p className="text-sm font-medium text-[var(--color-ink)]">
                      {t('admin.fields.heroMobileImagePreview')}
                    </p>
                    <ResponsiveImage
                      image={draft.hero.mobileImage ?? draft.hero.image}
                      alt=""
                      className="aspect-[9/16] rounded-md border border-[var(--color-border)] bg-[var(--color-deep)]"
                      imgClassName="object-cover object-[63%_48%]"
                    />
                  </div>
                </div>
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
                <div className="grid gap-4 rounded-md border border-[var(--color-border)] bg-[var(--color-paper)] p-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                  <div className="grid gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--color-ink)]">
                        {t('admin.fields.areaImage')}
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                        {t('admin.fields.areaImageHelp')}
                      </p>
                    </div>
                    <TextInput
                      label={t('admin.fields.imageUrl')}
                      value={draft.area.image.src}
                      onChange={(value) =>
                        mutate((next) => {
                          next.area.image = { src: value, type: 'image' }
                        })
                      }
                    />
                    <GalleryItemMediaPicker
                      accept="image/*"
                      allowVideo={false}
                      unsupportedMessage={t('admin.mediaUploadImageUnsupported')}
                      onUploaded={(upload) =>
                        mutate((next) => {
                          next.area.image = { ...upload.asset, type: 'image' }
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <p className="text-sm font-medium text-[var(--color-ink)]">{t('admin.fields.areaImagePreview')}</p>
                    <ResponsiveImage
                      image={draft.area.image}
                      alt=""
                      className="aspect-[4/3] rounded-md border border-[var(--color-border)] bg-[var(--color-deep)]"
                      imgClassName="object-cover"
                    />
                  </div>
                </div>
                <LocalizedField
                  label={t('sections.bookingEyebrow')}
                  value={draft.booking.title}
                  onChange={(language, value) => mutate((next) => void (next.booking.title[language] = value))}
                />
              </div>
            ) : null}

            {activeTab === 'gallery' ? (
              <div className="grid gap-5">
                <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-paper)] p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--color-ink)]">
                        {t('admin.fields.gallerySectionsTitle')}
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                        {t('admin.fields.gallerySectionsLead')}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setOpenGallerySectionIds(gallerySectionIds)}
                      >
                        {t('admin.fields.expandAllGalleries')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setOpenGallerySectionIds([])}
                      >
                        {t('admin.fields.collapseAllGalleries')}
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {draft.gallerySections.map((section) => {
                      const isOpen = openGallerySectionIds.includes(section.id)

                      return (
                        <button
                          key={section.id}
                          type="button"
                          className={cn(
                            'rounded-md border px-3 py-2 text-left text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-water)]',
                            isOpen
                              ? 'border-[var(--color-brass)] bg-[var(--color-brass)] text-[var(--color-deep)]'
                              : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:border-[var(--color-sage)]',
                          )}
                          onClick={() => openGallerySectionAndScroll(section.id)}
                        >
                          {localize(section.title, locale)}
                          <span className="ml-2 font-medium opacity-75">
                            {t('admin.fields.galleryMediaCount', { count: section.items.length })}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                {draft.gallerySections.map((section, sectionIndex) => (
                  <article
                    key={section.id}
                    id={`admin-gallery-${section.id}`}
                    className="grid gap-5 rounded-md border border-[var(--color-border)] bg-[var(--color-paper)] p-4"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left transition hover:border-[var(--color-sage)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-water)]"
                      aria-expanded={openGallerySectionIds.includes(section.id)}
                      aria-controls={`admin-gallery-panel-${section.id}`}
                      onClick={() => toggleGallerySection(section.id)}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-lg font-semibold text-[var(--color-ink)]">
                          {localize(section.title, locale)}
                        </span>
                        <span className="mt-1 block text-sm leading-6 text-[var(--color-muted)]">
                          {t('admin.fields.galleryMediaCount', { count: section.items.length })}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-3 text-sm font-semibold text-[var(--color-ink)]">
                        {openGallerySectionIds.includes(section.id)
                          ? t('admin.fields.collapseGallery')
                          : t('admin.fields.expandGallery')}
                        <ChevronDown
                          aria-hidden="true"
                          className={cn(
                            'size-5 transition',
                            openGallerySectionIds.includes(section.id) && 'rotate-180',
                          )}
                        />
                      </span>
                    </button>
                    <div
                      id={`admin-gallery-panel-${section.id}`}
                      className={cn('grid gap-5', !openGallerySectionIds.includes(section.id) && 'hidden')}
                    >
                      <div className="grid gap-4">
                        <LocalizedField
                          label={t('admin.fields.galleryGroupTitle')}
                          value={section.title}
                          onChange={(language, value) =>
                            mutate((next) => void (next.gallerySections[sectionIndex].title[language] = value))
                          }
                        />
                        <LocalizedField
                          label={t('admin.fields.galleryGroupLead')}
                          value={section.lead}
                          textarea
                          onChange={(language, value) =>
                            mutate((next) => void (next.gallerySections[sectionIndex].lead[language] = value))
                          }
                        />
                      </div>
                      <div className="grid gap-4">
                        <p className="text-sm leading-6 text-[var(--color-muted)]">
                          {t('admin.fields.galleryOrderHelp')}
                        </p>
                        {section.items.map((item, itemIndex) => (
                          <div
                            key={item.id}
                            className={cn(
                              'relative grid gap-4 rounded-md border border-[var(--color-border)] p-4 transition duration-200',
                              draggedGalleryItem?.itemId === item.id && 'scale-[0.99] opacity-60',
                              galleryDropTarget?.sectionIndex === sectionIndex &&
                                galleryDropTarget.itemId === item.id &&
                                draggedGalleryItem?.itemId !== item.id &&
                                'border-[var(--color-brass)] bg-[rgba(214,181,138,0.08)] shadow-[var(--shadow-soft)]',
                            )}
                            onDragOver={(event) => handleGalleryItemDragOver(event, sectionIndex, item.id)}
                            onDragEnter={(event) => handleGalleryItemDragOver(event, sectionIndex, item.id)}
                            onDragLeave={(event) => {
                              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                                setGalleryDropTarget(null)
                              }
                            }}
                            onDrop={(event) => {
                              event.preventDefault()
                              finishGalleryItemDrop(
                                sectionIndex,
                                item.id,
                                galleryDropTarget?.sectionIndex === sectionIndex && galleryDropTarget.itemId === item.id
                                  ? galleryDropTarget.position
                                  : 'after',
                              )
                            }}
                          >
                            {galleryDropTarget?.sectionIndex === sectionIndex &&
                            galleryDropTarget.itemId === item.id &&
                            draggedGalleryItem?.itemId !== item.id ? (
                              <span
                                aria-hidden="true"
                                className={cn(
                                  'pointer-events-none absolute inset-x-4 h-1 rounded-full bg-[var(--color-brass)] shadow-[0_0_18px_rgba(214,181,138,0.55)]',
                                  galleryDropTarget.position === 'before'
                                    ? 'top-0 -translate-y-1/2'
                                    : 'bottom-0 translate-y-1/2',
                                )}
                              />
                            ) : null}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex min-w-0 items-center gap-3">
                                <button
                                  type="button"
                                  draggable
                                  className="grid size-10 shrink-0 cursor-grab place-items-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] transition hover:border-[var(--color-brass)] hover:text-[var(--color-ink)] active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-water)]"
                                  title={t('admin.fields.dragGalleryMedia')}
                                  aria-label={t('admin.fields.dragGalleryMedia')}
                                  onDragStart={(event) => handleGalleryItemDragStart(event, sectionIndex, item.id)}
                                  onDragEnd={resetGalleryDrag}
                                >
                                  <GripVertical aria-hidden="true" className="size-5" />
                                </button>
                                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-brass)]">
                                  {itemIndex + 1}
                                </span>
                                <h2 className="min-w-0 truncate text-lg font-semibold text-[var(--color-ink)]">
                                  {localize(item.title, locale)}
                                </h2>
                              </div>
                              <div className="flex shrink-0 flex-wrap items-center gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="px-2"
                                  disabled={itemIndex === 0}
                                  title={t('admin.fields.moveGalleryMediaUp')}
                                  aria-label={t('admin.fields.moveGalleryMediaUp')}
                                  onClick={() => moveGalleryItem(sectionIndex, itemIndex, itemIndex - 1)}
                                >
                                  <ArrowUp aria-hidden="true" className="size-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="px-2"
                                  disabled={itemIndex === section.items.length - 1}
                                  title={t('admin.fields.moveGalleryMediaDown')}
                                  aria-label={t('admin.fields.moveGalleryMediaDown')}
                                  onClick={() => moveGalleryItem(sectionIndex, itemIndex, itemIndex + 1)}
                                >
                                  <ArrowDown aria-hidden="true" className="size-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="danger"
                                  onClick={() =>
                                    mutate((next) => void next.gallerySections[sectionIndex].items.splice(itemIndex, 1))
                                  }
                                >
                                  {t('common.remove')}
                                </Button>
                              </div>
                            </div>
                            <LocalizedField
                              label={t('admin.fields.title')}
                              value={item.title}
                              onChange={(language, value) =>
                                mutate(
                                  (next) =>
                                    void (next.gallerySections[sectionIndex].items[itemIndex].title[language] = value),
                                )
                              }
                            />
                            <LocalizedField
                              label={t('admin.fields.alt')}
                              value={item.alt}
                              onChange={(language, value) =>
                                mutate(
                                  (next) =>
                                    void (next.gallerySections[sectionIndex].items[itemIndex].alt[language] = value),
                                )
                              }
                            />
                            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_260px] lg:items-start">
                              <div className="grid gap-3">
                                <TextInput
                                  label={t('admin.fields.mediaUrl')}
                                  value={item.image.src}
                                  onChange={(value) =>
                                    mutate((next) => {
                                      next.gallerySections[sectionIndex].items[itemIndex].image = {
                                        src: value,
                                        type: next.gallerySections[sectionIndex].items[itemIndex].image.type ?? 'image',
                                      }
                                    })
                                  }
                                />
                                <GalleryItemMediaPicker
                                  onUploaded={(upload) =>
                                    mutate((next) => {
                                      next.gallerySections[sectionIndex].items[itemIndex].image = upload.asset
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
                                        void (next.gallerySections[sectionIndex].items[itemIndex].image.type =
                                          event.target.value as 'image' | 'video'),
                                    )
                                  }
                                >
                                  <option value="image">{t('admin.mediaTypeImage')}</option>
                                  <option value="video">{t('admin.mediaTypeVideo')}</option>
                                </select>
                              </label>
                              <div className="grid gap-2">
                                <p className="text-sm font-medium text-[var(--color-ink)]">
                                  {t('admin.fields.mediaPreview')}
                                </p>
                                <MediaPreview image={item.image} />
                              </div>
                            </div>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            mutate((next) =>
                              void next.gallerySections[sectionIndex].items.push(createGalleryItem(next.hero.image)),
                            )
                          }
                        >
                          {t('admin.fields.addGalleryMedia')}
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}

            {activeTab === 'pricing' ? (
              <div className="grid gap-5">
                <label className="flex flex-col gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-paper)] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="min-w-0">
                    <span className="block text-base font-semibold text-[var(--color-ink)]">
                      {t('admin.fields.room2Enabled')}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-[var(--color-muted)]">
                      {t('admin.fields.room2EnabledHelp', { count: draft.pricing.room1Capacity })}
                    </span>
                  </span>
                  <input
                    className="h-6 w-11 shrink-0 accent-[var(--color-brass)]"
                    type="checkbox"
                    checked={draft.pricing.room2Enabled}
                    onChange={(event) =>
                      mutate((next) => {
                        next.pricing.room2Enabled = event.target.checked
                      })
                    }
                  />
                </label>
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
                <div className="grid gap-4 rounded-md border border-[var(--color-border)] bg-[var(--color-paper)] p-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--color-ink)]">
                      {t('admin.fields.discountsTitle')}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                      {t('admin.fields.discountsLead')}
                    </p>
                  </div>
                  {draft.pricing.discounts.length === 0 ? (
                    <p className="rounded-md bg-[var(--color-deep)] p-3 text-sm text-[var(--color-muted)]">
                      {t('admin.fields.discountsEmpty')}
                    </p>
                  ) : null}
                  {draft.pricing.discounts.map((discount, index) => (
                    <article
                      key={discount.id}
                      className="grid gap-4 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                    >
                      <div className="grid gap-3 md:grid-cols-[minmax(12rem,1fr)_10rem_minmax(13rem,0.8fr)_auto] md:items-end">
                        <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
                          {t('admin.fields.discountCode')}
                          <input
                            className="field uppercase"
                            value={discount.code}
                            onChange={(event) =>
                              mutate(
                                (next) =>
                                  void (next.pricing.discounts[index].code = discountCodeValue(event.target.value)),
                              )
                            }
                          />
                        </label>
                        <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
                          {t('admin.fields.discountPercent')}
                          <input
                            className="field"
                            type="number"
                            min={1}
                            max={100}
                            value={discount.percent}
                            onChange={(event) =>
                              mutate(
                                (next) =>
                                  void (next.pricing.discounts[index].percent = discountPercentValue(event)),
                              )
                            }
                          />
                        </label>
                        <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
                          {t('admin.fields.discountType')}
                          <select
                            className="field"
                            value={discount.type ?? 'permanent'}
                            onChange={(event) =>
                              mutate((next) => {
                                setDiscountType(
                                  next.pricing.discounts[index],
                                  event.target.value as DiscountCodeType,
                                )
                              })
                            }
                          >
                            <option value="permanent">{t('admin.fields.discountTypePermanent')}</option>
                            <option value="dateRange">{t('admin.fields.discountTypeDateRange')}</option>
                            <option value="recurring">{t('admin.fields.discountTypeRecurring')}</option>
                          </select>
                        </label>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          onClick={() => mutate((next) => void next.pricing.discounts.splice(index, 1))}
                        >
                          {t('common.remove')}
                        </Button>
                      </div>

                      {(discount.type ?? 'permanent') === 'dateRange' ? (
                        <div className="grid gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-paper)] p-3 sm:grid-cols-2">
                          <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
                            {t('admin.fields.discountValidFrom')}
                            <input
                              className="field"
                              type="date"
                              value={discount.validFrom ?? ''}
                              onChange={(event) =>
                                mutate((next) => {
                                  const item = next.pricing.discounts[index]
                                  item.validFrom = event.target.value
                                  if (!item.validTo || item.validTo < item.validFrom) {
                                    item.validTo = item.validFrom
                                  }
                                })
                              }
                            />
                          </label>
                          <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
                            {t('admin.fields.discountValidTo')}
                            <input
                              className="field"
                              type="date"
                              min={discount.validFrom}
                              value={discount.validTo ?? ''}
                              onChange={(event) =>
                                mutate((next) => {
                                  next.pricing.discounts[index].validTo = event.target.value
                                })
                              }
                            />
                          </label>
                        </div>
                      ) : null}

                      {(discount.type ?? 'permanent') === 'recurring' ? (
                        <fieldset className="grid gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-paper)] p-3">
                          <legend className="px-1 text-sm font-semibold text-[var(--color-ink)]">
                            {t('admin.fields.discountWeekdays')}
                          </legend>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                            {discountWeekdays.map((weekday) => (
                              <label
                                key={weekday}
                                className={cn(
                                  'flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                                  discount.weekdays?.includes(weekday)
                                    ? 'border-[var(--color-brass)] bg-[var(--color-brass)]/10 text-[var(--color-ink)]'
                                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)]',
                                )}
                              >
                                <input
                                  className="size-4 accent-[var(--color-brass)]"
                                  type="checkbox"
                                  checked={discount.weekdays?.includes(weekday) ?? false}
                                  onChange={() =>
                                    mutate((next) => {
                                      toggleDiscountWeekday(next.pricing.discounts[index], weekday)
                                    })
                                  }
                                />
                                {t(`admin.fields.discountWeekday${weekday}`)}
                              </label>
                            ))}
                          </div>
                        </fieldset>
                      ) : null}

                      <p className="text-sm leading-6 text-[var(--color-muted)]">
                        {(discount.type ?? 'permanent') === 'permanent'
                          ? t('admin.fields.discountPermanentHelp')
                          : discount.type === 'dateRange'
                            ? t('admin.fields.discountDateRangeHelp')
                            : t('admin.fields.discountRecurringHelp')}
                      </p>
                    </article>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      mutate((next) =>
                        void next.pricing.discounts.push({
                          id: crypto.randomUUID(),
                          code: 'RABAT10',
                          percent: 10,
                          type: 'permanent',
                        }),
                      )
                    }
                  >
                    {t('admin.fields.addDiscount')}
                  </Button>
                </div>
                <p className="rounded-md bg-[var(--color-paper)] p-4 text-sm text-[var(--color-muted)]">
                  {draft.pricing.room2Enabled
                    ? `8 osób: ${formatMoney(draft.pricing.room1Nightly + draft.pricing.room2Nightly, locale)}`
                    : t('admin.fields.room2DisabledSummary', { count: draft.pricing.room1Capacity })}
                </p>
              </div>
            ) : null}

            {activeTab === 'availability' ? (
              <div className="grid gap-5">
                <div className="flex flex-wrap items-end justify-between gap-4 rounded-md border border-[var(--color-border)] bg-[var(--color-paper)] p-4">
                  <fieldset className="flex flex-wrap gap-4">
                    <legend className="mb-2 text-sm font-medium text-[var(--color-ink)]">
                      {t('admin.fields.availabilityDisplay')}
                    </legend>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-ink)]">
                      <input
                        type="checkbox"
                        className="size-4 accent-[var(--color-brass)]"
                        checked={showBookedAvailability}
                        onChange={(event) => {
                          setShowBookedAvailability(event.target.checked)
                          setAvailabilityPage(1)
                        }}
                      />
                      <span className="size-2.5 rounded-full bg-red-500 ring-4 ring-red-500/15" aria-hidden="true" />
                      {t('booking.booked')}
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-ink)]">
                      <input
                        type="checkbox"
                        className="size-4 accent-[var(--color-brass)]"
                        checked={showUnavailableAvailability}
                        onChange={(event) => {
                          setShowUnavailableAvailability(event.target.checked)
                          setAvailabilityPage(1)
                        }}
                      />
                      <span className="size-2.5 rounded-full bg-sky-400 ring-4 ring-sky-400/15" aria-hidden="true" />
                      {t('booking.unavailable')}
                    </label>
                  </fieldset>
                  <label className="grid min-w-52 gap-2 text-sm font-medium text-[var(--color-ink)]">
                    {t('admin.fields.availabilitySort')}
                    <select
                      className="field"
                      value={availabilitySort}
                      onChange={(event) => {
                        setAvailabilitySort(event.target.value as AvailabilitySortOption)
                        setAvailabilityPage(1)
                      }}
                    >
                      <option value="dateAsc">{t('admin.fields.availabilitySortAsc')}</option>
                      <option value="dateDesc">{t('admin.fields.availabilitySortDesc')}</option>
                    </select>
                  </label>
                </div>
                {draft.availability.length === 0 ? (
                  <p className="rounded-md bg-[var(--color-paper)] p-4 text-sm text-[var(--color-muted)]">
                    {t('admin.fields.availabilityEmpty')}
                  </p>
                ) : null}
                {draft.availability.length > 0 && filteredAvailability.length === 0 ? (
                  <p className="rounded-md bg-[var(--color-paper)] p-4 text-sm text-[var(--color-muted)]">
                    {t('admin.fields.availabilityFilteredEmpty')}
                  </p>
                ) : null}
                {visibleAvailability.map(({ range, index }) => (
                  <article key={range.id} className="grid gap-4 rounded-md border border-[var(--color-border)] p-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[minmax(10rem,0.7fr)_1fr_1fr_auto] lg:items-end">
                      <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
                        {t('admin.fields.availabilityStatus')}
                        <select
                          className="field"
                          value={range.status}
                          onChange={(event) => {
                            const status = event.target.value as AvailabilityStatus
                            mutate((next) => {
                              next.availability[index].status = status
                            })
                            if (status === 'booked') {
                              setShowBookedAvailability(true)
                            } else {
                              setShowUnavailableAvailability(true)
                            }
                          }}
                        >
                          <option value="unavailable">{t('booking.unavailable')}</option>
                          <option value="booked">{t('booking.booked')}</option>
                        </select>
                      </label>
                      <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
                        {t('admin.fields.availabilityFrom')}
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
                              item.to = getExclusiveUnavailableEnd(currentInclusiveEnd, item.from)
                            })
                          }
                        />
                      </label>
                      <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
                        {t('admin.fields.availabilityTo')}
                        <input
                          className="field"
                          type="date"
                          min={range.from}
                          value={getInclusiveUnavailableEnd(range)}
                          onChange={(event) =>
                            mutate((next) => {
                              const item = next.availability[index]
                              item.to = getExclusiveUnavailableEnd(event.target.value, item.from)
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
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-[var(--color-muted)]">
                      <span
                        className={cn(
                          'size-2.5 rounded-full ring-4',
                          range.status === 'booked'
                            ? 'bg-red-500 ring-red-500/15'
                            : 'bg-sky-400 ring-sky-400/15',
                        )}
                        aria-hidden="true"
                      />
                      {range.status === 'booked' ? t('booking.booked') : t('booking.unavailable')}:{' '}
                      {range.from} - {getInclusiveUnavailableEnd(range)}
                    </p>
                  </article>
                ))}
                {filteredAvailability.length > availabilityPageSize ? (
                  <nav
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-paper)] p-3"
                    aria-label={t('admin.fields.availabilityPagination')}
                  >
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={currentAvailabilityPage === 1}
                      onClick={() => setAvailabilityPage(Math.max(1, currentAvailabilityPage - 1))}
                    >
                      {t('admin.fields.previousPage')}
                    </Button>
                    <span className="text-sm font-medium text-[var(--color-muted)]" aria-live="polite">
                      {t('admin.fields.pageOf', { page: currentAvailabilityPage, pages: availabilityPageCount })}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={currentAvailabilityPage === availabilityPageCount}
                      onClick={() => setAvailabilityPage(Math.min(availabilityPageCount, currentAvailabilityPage + 1))}
                    >
                      {t('admin.fields.nextPage')}
                    </Button>
                  </nav>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      mutate((next) => void next.availability.push(createAvailabilityRange('booked')))
                      setShowBookedAvailability(true)
                      setAvailabilitySort('dateDesc')
                      setAvailabilityPage(1)
                    }}
                  >
                    <Plus aria-hidden="true" className="size-4" />
                    {t('admin.fields.addBookedAvailabilityRange')}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      mutate((next) => void next.availability.push(createAvailabilityRange('unavailable')))
                      setShowUnavailableAvailability(true)
                      setAvailabilitySort('dateDesc')
                      setAvailabilityPage(1)
                    }}
                  >
                    <Plus aria-hidden="true" className="size-4" />
                    {t('admin.fields.addUnavailableAvailabilityRange')}
                  </Button>
                </div>
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

            {activeTab === 'area' ? (
              <div className="grid gap-6">
                <div className="grid gap-4 rounded-md border border-[var(--color-border)] bg-[var(--color-paper)] p-4">
                  <h2 className="text-lg font-semibold text-[var(--color-ink)]">{t('sections.restaurantsTitle')}</h2>
                  {draft.area.restaurants.map((item, index) => (
                    <article key={item.id} className="grid gap-4 rounded-md border border-[var(--color-border)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-base font-semibold text-[var(--color-ink)]">{localize(item.title, locale)}</h3>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          onClick={() => mutate((next) => void next.area.restaurants.splice(index, 1))}
                        >
                          {t('common.remove')}
                        </Button>
                      </div>
                      <LocalizedField
                        label={t('admin.fields.title')}
                        value={item.title}
                        onChange={(language, value) =>
                          mutate((next) => void (next.area.restaurants[index].title[language] = value))
                        }
                      />
                      <LocalizedField
                        label={t('admin.fields.distance')}
                        value={item.distance}
                        onChange={(language, value) =>
                          mutate((next) => void (next.area.restaurants[index].distance[language] = value))
                        }
                      />
                      <LocalizedField
                        label={t('admin.fields.description')}
                        value={item.description}
                        textarea
                        onChange={(language, value) =>
                          mutate((next) => void (next.area.restaurants[index].description[language] = value))
                        }
                      />
                      <div className="grid gap-3">
                        <p className="text-sm font-medium text-[var(--color-ink)]">
                          {t('admin.fields.restaurantSpecialties')}
                        </p>
                        {(item.details ?? []).map((detail, detailIndex) => (
                          <div key={`${item.id}-${detailIndex}`} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                            <LocalizedField
                              label={t('admin.fields.specialty')}
                              value={detail}
                              onChange={(language, value) =>
                                mutate((next) => {
                                  const details = next.area.restaurants[index].details ?? []
                                  next.area.restaurants[index].details = details
                                  details[detailIndex][language] = value
                                })
                              }
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              onClick={() =>
                                mutate((next) => {
                                  next.area.restaurants[index].details?.splice(detailIndex, 1)
                                })
                              }
                            >
                              {t('common.remove')}
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            mutate((next) => {
                              next.area.restaurants[index].details = next.area.restaurants[index].details ?? []
                              next.area.restaurants[index].details?.push({ pl: 'Specjalność', en: 'Specialty' })
                            })
                          }
                        >
                          {t('admin.fields.addSpecialty')}
                        </Button>
                      </div>
                    </article>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => mutate((next) => void next.area.restaurants.push(createAreaInfoItem()))}
                  >
                    {t('admin.fields.addRestaurant')}
                  </Button>
                </div>

                <div className="grid gap-4 rounded-md border border-[var(--color-border)] bg-[var(--color-paper)] p-4">
                  <h2 className="text-lg font-semibold text-[var(--color-ink)]">{t('sections.nearbyTitle')}</h2>
                  {draft.area.nearby.map((item, index) => (
                    <article key={item.id} className="grid gap-4 rounded-md border border-[var(--color-border)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-base font-semibold text-[var(--color-ink)]">{localize(item.title, locale)}</h3>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          onClick={() => mutate((next) => void next.area.nearby.splice(index, 1))}
                        >
                          {t('common.remove')}
                        </Button>
                      </div>
                      <LocalizedField
                        label={t('admin.fields.title')}
                        value={item.title}
                        onChange={(language, value) =>
                          mutate((next) => void (next.area.nearby[index].title[language] = value))
                        }
                      />
                      <LocalizedField
                        label={t('admin.fields.distance')}
                        value={item.distance}
                        onChange={(language, value) =>
                          mutate((next) => void (next.area.nearby[index].distance[language] = value))
                        }
                      />
                      <LocalizedField
                        label={t('admin.fields.description')}
                        value={item.description}
                        textarea
                        onChange={(language, value) =>
                          mutate((next) => void (next.area.nearby[index].description[language] = value))
                        }
                      />
                    </article>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => mutate((next) => void next.area.nearby.push(createAreaInfoItem()))}
                  >
                    {t('admin.fields.addNearbyPlace')}
                  </Button>
                </div>

                <div className="grid gap-4 rounded-md border border-[var(--color-border)] bg-[var(--color-paper)] p-4">
                  <h2 className="text-lg font-semibold text-[var(--color-ink)]">{t('sections.busAccessTitle')}</h2>
                  {draft.area.busRoutes.map((item, index) => (
                    <article key={item.id} className="grid gap-4 rounded-md border border-[var(--color-border)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-base font-semibold text-[var(--color-ink)]">{localize(item.title, locale)}</h3>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          onClick={() => mutate((next) => void next.area.busRoutes.splice(index, 1))}
                        >
                          {t('common.remove')}
                        </Button>
                      </div>
                      <LocalizedField
                        label={t('admin.fields.title')}
                        value={item.title}
                        onChange={(language, value) =>
                          mutate((next) => void (next.area.busRoutes[index].title[language] = value))
                        }
                      />
                      <LocalizedField
                        label={t('admin.fields.distance')}
                        value={item.distance}
                        onChange={(language, value) =>
                          mutate((next) => void (next.area.busRoutes[index].distance[language] = value))
                        }
                      />
                      <LocalizedField
                        label={t('admin.fields.description')}
                        value={item.description}
                        textarea
                        onChange={(language, value) =>
                          mutate((next) => void (next.area.busRoutes[index].description[language] = value))
                        }
                      />
                      <LocalizedField
                        label={t('admin.fields.linkLabel')}
                        value={item.link?.label ?? { pl: 'Rozkład jazdy', en: 'Timetable' }}
                        onChange={(language, value) =>
                          mutate((next) => {
                            const link = next.area.busRoutes[index].link ?? {
                              label: { pl: 'Rozkład jazdy', en: 'Timetable' },
                              href: '',
                            }

                            link.label[language] = value
                            next.area.busRoutes[index].link = link
                          })
                        }
                      />
                      <TextInput
                        label={t('admin.fields.linkUrl')}
                        value={item.link?.href ?? ''}
                        onChange={(value) =>
                          mutate((next) => {
                            const link = next.area.busRoutes[index].link ?? {
                              label: { pl: 'Rozkład jazdy', en: 'Timetable' },
                              href: '',
                            }

                            link.href = value
                            next.area.busRoutes[index].link = link
                          })
                        }
                      />
                    </article>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => mutate((next) => void next.area.busRoutes.push(createAreaInfoItem()))}
                  >
                    {t('admin.fields.addBusRoute')}
                  </Button>
                </div>

                <div className="grid gap-4 rounded-md border border-[var(--color-border)] bg-[var(--color-paper)] p-4">
                  <h2 className="text-lg font-semibold text-[var(--color-ink)]">{t('sections.airportsTitle')}</h2>
                  {draft.area.airports.map((item, index) => (
                    <article key={item.id} className="grid gap-4 rounded-md border border-[var(--color-border)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-base font-semibold text-[var(--color-ink)]">{localize(item.title, locale)}</h3>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          onClick={() => mutate((next) => void next.area.airports.splice(index, 1))}
                        >
                          {t('common.remove')}
                        </Button>
                      </div>
                      <LocalizedField
                        label={t('admin.fields.title')}
                        value={item.title}
                        onChange={(language, value) =>
                          mutate((next) => void (next.area.airports[index].title[language] = value))
                        }
                      />
                      <LocalizedField
                        label={t('admin.fields.distance')}
                        value={item.distance}
                        onChange={(language, value) =>
                          mutate((next) => void (next.area.airports[index].distance[language] = value))
                        }
                      />
                      <LocalizedField
                        label={t('admin.fields.description')}
                        value={item.description}
                        textarea
                        onChange={(language, value) =>
                          mutate((next) => void (next.area.airports[index].description[language] = value))
                        }
                      />
                    </article>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => mutate((next) => void next.area.airports.push(createAreaInfoItem()))}
                  >
                    {t('admin.fields.addAirport')}
                  </Button>
                </div>

                <div className="grid gap-4 rounded-md border border-[var(--color-border)] bg-[var(--color-paper)] p-4">
                  <LocalizedField
                    label={t('admin.fields.bikeRoutesTitle')}
                    value={draft.area.bikeRoutes.title}
                    onChange={(language, value) =>
                      mutate((next) => void (next.area.bikeRoutes.title[language] = value))
                    }
                  />
                  <LocalizedField
                    label={t('admin.fields.bikeRoutesLead')}
                    value={draft.area.bikeRoutes.lead}
                    textarea
                    onChange={(language, value) =>
                      mutate((next) => void (next.area.bikeRoutes.lead[language] = value))
                    }
                  />
                  {draft.area.bikeRoutes.routes.map((route, index) => (
                    <div key={index} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                      <LocalizedField
                        label={t('admin.fields.routeName')}
                        value={route}
                        onChange={(language, value) =>
                          mutate((next) => void (next.area.bikeRoutes.routes[index][language] = value))
                        }
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        onClick={() => mutate((next) => void next.area.bikeRoutes.routes.splice(index, 1))}
                      >
                        {t('common.remove')}
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      mutate((next) => void next.area.bikeRoutes.routes.push({ pl: 'Nowa trasa', en: 'New route' }))
                    }
                  >
                    {t('admin.fields.addRoute')}
                  </Button>
                </div>

                <div className="grid gap-4 rounded-md border border-[var(--color-border)] bg-[var(--color-paper)] p-4">
                  <h2 className="text-lg font-semibold text-[var(--color-ink)]">{t('sections.placesTitle')}</h2>
                  {draft.area.items.map((item, index) => (
                    <article key={item.id} className="grid gap-4 rounded-md border border-[var(--color-border)] p-4">
                      <div className="grid gap-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
                        <LocalizedField
                          label={t('admin.fields.title')}
                          value={item.title}
                          onChange={(language, value) =>
                            mutate((next) => void (next.area.items[index].title[language] = value))
                          }
                        />
                        <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
                          {t('admin.fields.icon')}
                          <select
                            className="field"
                            value={item.icon}
                            onChange={(event) =>
                              mutate((next) => void (next.area.items[index].icon = event.target.value as IconKey))
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
                          onClick={() => mutate((next) => void next.area.items.splice(index, 1))}
                        >
                          {t('common.remove')}
                        </Button>
                      </div>
                      <LocalizedField
                        label={t('admin.fields.distance')}
                        value={item.distance}
                        onChange={(language, value) =>
                          mutate((next) => void (next.area.items[index].distance[language] = value))
                        }
                      />
                      <LocalizedField
                        label={t('admin.fields.description')}
                        value={item.description}
                        textarea
                        onChange={(language, value) =>
                          mutate((next) => void (next.area.items[index].description[language] = value))
                        }
                      />
                    </article>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => mutate((next) => void next.area.items.push(createAreaPlace()))}
                  >
                    {t('admin.fields.addPlace')}
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
                    label={t('admin.fields.secondaryPhone')}
                    value={draft.contact.secondaryPhone ?? ''}
                    onChange={(value) => mutate((next) => void (next.contact.secondaryPhone = value))}
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
            className="fixed inset-0 z-50 grid place-items-center bg-[rgba(15,23,42,0.78)] px-5 py-8 backdrop-blur-sm"
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
            className="fixed inset-0 z-50 grid place-items-center bg-[rgba(15,23,42,0.78)] px-5 py-8 backdrop-blur-sm"
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
