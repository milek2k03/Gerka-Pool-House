import { apartmentLabel } from '../utils/apartments'
import type { ReservationRequest } from '../types/booking'
import type { Locale } from '../types/common'
import type { SiteContent } from '../types/content'

export interface EmailPayload {
  ownerEmail: string
  clientEmail: string
  reservationNumber: string
  ownerSubject: string
  ownerBody: string
  clientSubject: string
  clientBody: string
}

export type EmailDeliveryProvider = 'endpoint' | 'local'

export interface EmailDeliveryResult {
  provider: EmailDeliveryProvider
  payload: EmailPayload
}

const endpointUrl = import.meta.env.VITE_RESERVATION_EMAIL_ENDPOINT

const emailCopy = {
  pl: {
    ownerSubject: 'Nowe zapytanie rezerwacyjne',
    reservationNumber: 'Numer zapytania',
    client: 'Klient',
    email: 'E-mail',
    phone: 'Telefon',
    guests: 'Goście',
    dates: 'Termin',
    nights: 'Liczba nocy',
    rooms: 'Apartamenty',
    estimatedPrice: 'Szacowana cena',
    message: 'Wiadomość',
    automaticNotice: 'Ta wiadomość została wygenerowana automatycznie. Prosimy na nią nie odpowiadać.',
  },
  en: {
    ownerSubject: 'New booking inquiry',
    reservationNumber: 'Inquiry number',
    client: 'Guest',
    email: 'Email',
    phone: 'Phone',
    guests: 'Guests',
    dates: 'Dates',
    nights: 'Number of nights',
    rooms: 'Apartments',
    estimatedPrice: 'Estimated price',
    message: 'Message',
    automaticNotice: 'This message was generated automatically. Please do not reply to it.',
  },
} as const

function appendAutomaticNotice(body: string, notice: string) {
  if (body.includes(notice)) return body

  return `${body}\n\n${notice}`
}

export const emailService = {
  async sendReservationInquiry(
    request: ReservationRequest,
    content: SiteContent,
    locale: Locale,
  ): Promise<EmailDeliveryResult> {
    const copy = emailCopy[locale]
    const ownerBody = [
      `${copy.reservationNumber}: ${request.reservationNumber}`,
      `${copy.client}: ${request.fullName}`,
      `${copy.email}: ${request.email}`,
      `${copy.phone}: ${request.phone}`,
      `${copy.guests}: ${request.guests}`,
      `${copy.dates}: ${request.checkIn} - ${request.checkOut}`,
      `${copy.nights}: ${request.nights}`,
      `${copy.rooms}: ${apartmentLabel(request.apartment, locale)}`,
      `${copy.estimatedPrice}: ${request.estimatedTotal} ${content.pricing.currency}`,
      `${copy.message}: ${request.message || '-'}`,
    ].join('\n')

    const payload: EmailPayload = {
      ownerEmail: content.booking.ownerEmail,
      clientEmail: request.email,
      reservationNumber: request.reservationNumber,
      ownerSubject: `${copy.ownerSubject} - ${content.brandName}`,
      ownerBody,
      clientSubject: content.booking.confirmationSubject[locale],
      clientBody: appendAutomaticNotice(
        `${content.booking.confirmationBody[locale]}\n\n${copy.reservationNumber}: ${request.reservationNumber}\n${copy.rooms}: ${apartmentLabel(request.apartment, locale)}`,
        copy.automaticNotice,
      ),
    }

    if (endpointUrl) {
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          request,
          propertyName: content.brandName,
          currency: content.pricing.currency,
          locale,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => undefined)
        const message =
          errorBody && typeof errorBody === 'object' && 'error' in errorBody
            ? String(errorBody.error)
            : `Email endpoint failed with status ${response.status}`
        throw new Error(message)
      }

      return { provider: 'endpoint', payload }
    }

    window.dispatchEvent(new CustomEvent('gerka:email:queued', { detail: payload }))
    return { provider: 'local', payload }
  },
}
