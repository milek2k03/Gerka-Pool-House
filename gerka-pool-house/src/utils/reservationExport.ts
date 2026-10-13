import { apartmentLabel, getReservationApartment } from './apartments'
import type { ReservationRequest, ReservationStatus } from '../types/booking'
import type { Locale } from '../types/common'
import { formatDate, formatMoney } from './format'

const exportCopy = {
  pl: {
    reservationNumber: 'Numer zapytania',
    status: 'Status',
    fullName: 'Imię i nazwisko',
    email: 'E-mail',
    phone: 'Telefon',
    checkIn: 'Data przyjazdu',
    checkOut: 'Data wyjazdu',
    nights: 'Liczba nocy',
    guests: 'Liczba gości',
    roomsUsed: 'Wykorzystane apartamenty',
    nightlyPrice: 'Cena za noc',
    estimatedTotal: 'Cena szacunkowa',
    message: 'Wiadomość',
    createdAt: 'Data zgłoszenia',
  },
  en: {
    reservationNumber: 'Inquiry number',
    status: 'Status',
    fullName: 'Full name',
    email: 'Email',
    phone: 'Phone',
    checkIn: 'Check-in date',
    checkOut: 'Check-out date',
    nights: 'Nights',
    guests: 'Guests',
    roomsUsed: 'Apartments used',
    nightlyPrice: 'Price per night',
    estimatedTotal: 'Estimated price',
    message: 'Message',
    createdAt: 'Created at',
  },
} as const

function escapeCsvCell(value: string | number) {
  const normalized = String(value).replace(/\r?\n/g, ' ').trim()
  return `"${normalized.replace(/"/g, '""')}"`
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function safeFilenamePart(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

export function createReservationExportFilename(scope: string, locale: Locale) {
  const date = new Date().toISOString().slice(0, 10)
  const prefix = locale === 'pl' ? 'gerka-zapytania' : 'gerka-inquiries'

  return `${prefix}-${safeFilenamePart(scope)}-${date}.csv`
}

export function createSingleReservationExportFilename(reservation: ReservationRequest, locale: Locale) {
  const prefix = locale === 'pl' ? 'gerka-zapytanie' : 'gerka-inquiry'
  const reservationNumber = reservation.reservationNumber || reservation.id

  return `${prefix}-${safeFilenamePart(reservationNumber)}.csv`
}

export function downloadReservationsForExcel({
  filename,
  getStatusLabel,
  locale,
  reservations,
}: {
  filename: string
  getStatusLabel: (status: ReservationStatus) => string
  locale: Locale
  reservations: ReservationRequest[]
}) {
  const copy = exportCopy[locale]
  const headers = [
    copy.reservationNumber,
    copy.status,
    copy.fullName,
    copy.email,
    copy.phone,
    copy.checkIn,
    copy.checkOut,
    copy.nights,
    copy.guests,
    copy.roomsUsed,
    copy.nightlyPrice,
    copy.estimatedTotal,
    copy.message,
    copy.createdAt,
  ]
  const rows = reservations.map((reservation) => [
    reservation.reservationNumber || reservation.id,
    getStatusLabel(reservation.status),
    reservation.fullName,
    reservation.email,
    reservation.phone,
    formatDate(reservation.checkIn, locale),
    formatDate(reservation.checkOut, locale),
    reservation.nights,
    reservation.guests,
    apartmentLabel(getReservationApartment(reservation), locale),
    formatMoney(reservation.nightlyPrice, locale),
    formatMoney(reservation.estimatedTotal, locale),
    reservation.message || '',
    new Date(reservation.createdAt).toLocaleString(locale),
  ])
  const csv = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(';')).join('\r\n')

  downloadFile(filename, csv)
}
