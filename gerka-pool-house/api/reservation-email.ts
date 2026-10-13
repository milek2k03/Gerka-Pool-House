/// <reference types="node" />

import { nightsBetween } from '../src/utils/date.js'
import { bookingLimits } from '../src/constants/bookingLimits.js'
import { Resend } from 'resend'
import { z } from 'zod'

import { apartmentLabel, getReservationApartment } from '../src/utils/apartments.js'
import { resolveReservationOwnerEmail } from './_booking-settings.js'
import { loadLocalEnv } from './_env.js'

loadLocalEnv()

interface ApiRequest {
  method?: string
  headers: {
    origin?: string
    'x-forwarded-for'?: string | string[]
  }
  body: unknown
}

interface ApiResponse {
  setHeader: (name: string, value: string) => void
  status: (statusCode: number) => {
    json: (body: unknown) => void
    end: () => void
  }
}

const requestSchema = z
  .object({
    reservationNumber: z.string().min(6).max(64),
    ownerEmail: z.string().email(),
    clientEmail: z.string().email(),
    ownerSubject: z.string().min(1).max(bookingLimits.fullName),
    clientSubject: z.string().min(1).max(bookingLimits.fullName),
    clientBody: z.string().min(1).max(4000),
    propertyName: z.string().min(1).max(120),
    currency: z.string().min(1).max(8).default('PLN'),
    locale: z.enum(['pl', 'en']).default('pl'),
    request: z.object({
      reservationNumber: z.string().min(6).max(64),
      fullName: z.string().min(2).max(bookingLimits.fullName),
      email: z.string().email(),
      phone: z.string().min(6).max(bookingLimits.phone),
      guests: z.number().int().min(1).max(bookingLimits.maxGuests),
      checkIn: z.string().date(),
      checkOut: z.string().date(),
      nights: z.number().int().min(1).max(bookingLimits.maxNights),
      apartment: z.enum(['ground', 'upper', 'both']).optional(),
      roomsUsed: z.number().int().min(1).max(4),
      nightlyPrice: z.number().min(0),
      estimatedTotal: z.number().min(0),
      message: z.string().max(bookingLimits.emailMessage).optional(),
    }),
  })
  .superRefine((payload, context) => {
    const stay = payload.request
    if (stay.checkOut <= stay.checkIn || nightsBetween(stay.checkIn, stay.checkOut) !== stay.nights) {
      context.addIssue({ code: 'custom', path: ['request', 'nights'], message: 'Invalid stay dates or night count' })
    }
    if (stay.roomsUsed !== (stay.apartment === 'both' ? 2 : stay.apartment ? 1 : stay.roomsUsed)) {
      context.addIssue({ code: 'custom', path: ['request', 'roomsUsed'], message: 'Apartment allocation mismatch' })
    }
    if (payload.reservationNumber !== payload.request.reservationNumber) {
      context.addIssue({
        code: 'custom',
        path: ['reservationNumber'],
        message: 'Reservation number mismatch',
      })
    }

    if (payload.clientEmail.toLowerCase() !== payload.request.email.toLowerCase()) {
      context.addIssue({
        code: 'custom',
        path: ['clientEmail'],
        message: 'Client email mismatch',
      })
    }
  })

const rateLimitWindowMs = 10 * 60 * 1000
const rateLimitMaxRequests = 5
const requestLog = new Map<string, number[]>()

function escapeHtml(value: string | number) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function paragraph(value: string) {
  return value
    .split('\n')
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 10px">${escapeHtml(line)}</p>`)
    .join('')
}

function appendAutomaticNotice(body: string, notice: string) {
  if (body.includes(notice)) return body

  return `${body}\n\n${notice}`
}

function row(label: string, value: string | number) {
  return `<tr>
    <td style="padding:13px 16px;border-bottom:1px solid #e8e0d2;color:#5f695c;font-size:13px;line-height:1.35;width:42%">${escapeHtml(label)}</td>
    <td style="padding:13px 16px;border-bottom:1px solid #e8e0d2;color:#172016;font-size:14px;line-height:1.35;font-weight:700">${escapeHtml(value)}</td>
  </tr>`
}

function sectionTitle(title: string) {
  return `<tr>
    <td colspan="2" style="padding:11px 16px;background:#f2eadb;border-bottom:1px solid #e1d5c0;color:#8a6d32;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">${escapeHtml(title)}</td>
  </tr>`
}

function detailsTable(rows: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:0;border:1px solid #e1d5c0;border-radius:8px;overflow:hidden;margin:0 0 22px;background:#fffaf1">
    ${rows}
  </table>`
}

function messageBoxWithTitle(title: string, message: string) {
  return `<div style="margin-top:18px">
    <h2 style="font-size:16px;line-height:1.35;margin:0 0 10px;color:#172016">${escapeHtml(title)}</h2>
    <div style="border:1px solid #e1d5c0;border-radius:8px;background:#fffaf1;padding:16px;color:#172016;font-size:14px;line-height:1.6">
      ${paragraph(message || '-')}
    </div>
  </div>`
}

function wrapEmail(title: string, body: string, lang: 'pl' | 'en') {
  return `<!doctype html>
<html lang="${lang}">
  <body style="margin:0;background:#f6f3ec;font-family:Arial,sans-serif;color:#172016">
    <div style="max-width:680px;margin:0 auto;padding:32px 18px">
      <div style="background:#ffffff;border:1px solid #ded8cb;border-radius:10px;overflow:hidden">
        <div style="background:#172016;padding:24px 28px">
          <p style="margin:0 0 8px;color:#d6b36f;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">Gerka Pool House</p>
          <h1 style="margin:0;color:#ffffff;font-size:24px;line-height:1.25">${escapeHtml(title)}</h1>
        </div>
        <div style="padding:28px">
        ${body}
        </div>
      </div>
    </div>
  </body>
</html>`
}

const emailCopy = {
  pl: {
    newInquiry: 'Nowe zapytanie',
    inquiryDetails: 'Dane zapytania',
    clientDetails: 'Dane klienta',
    pricing: 'Wycena',
    inquirySummary: 'Podsumowanie zapytania',
    reservationNumber: 'Numer zapytania',
    client: 'Klient',
    email: 'E-mail',
    phone: 'Telefon',
    dates: 'Termin',
    nights: 'Liczba nocy',
    guests: 'Liczba gości',
    rooms: 'Wykorzystane apartamenty',
    nightlyPrice: 'Cena bazowa za noc (przed rabatem)',
    estimatedTotal: 'Cena szacunkowa',
    clientMessage: 'Wiadomość klienta',
    message: 'Wiadomość',
    automaticNotice: 'Ta wiadomość została wygenerowana automatycznie. Prosimy na nią nie odpowiadać.',
  },
  en: {
    newInquiry: 'New booking inquiry',
    inquiryDetails: 'Inquiry details',
    clientDetails: 'Guest details',
    pricing: 'Pricing',
    inquirySummary: 'Inquiry summary',
    reservationNumber: 'Inquiry number',
    client: 'Guest',
    email: 'Email',
    phone: 'Phone',
    dates: 'Dates',
    nights: 'Number of nights',
    guests: 'Number of guests',
    rooms: 'Apartments used',
    nightlyPrice: 'Base nightly price (before discount)',
    estimatedTotal: 'Estimated price',
    clientMessage: 'Guest message',
    message: 'Message',
    automaticNotice: 'This message was generated automatically. Please do not reply to it.',
  },
} as const

function getAllowedOrigins() {
  const configuredOrigins = (process.env.ALLOWED_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean)

  return Array.from(
    new Set(
      configuredOrigins.flatMap((origin) => {
        if (origin === 'https://gerkapoolhouse.pl') {
          return [origin, 'https://www.gerkapoolhouse.pl']
        }
        if (origin === 'https://www.gerkapoolhouse.pl') {
          return [origin, 'https://gerkapoolhouse.pl']
        }
        return [origin]
      }),
    ),
  )
}

function setCors(req: ApiRequest, res: ApiResponse) {
  const allowedOrigins = getAllowedOrigins()
  const origin = req.headers.origin

  if (origin && allowedOrigins.includes(origin.replace(/\/$/, ''))) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'no-store')
}

function isOriginAllowed(req: ApiRequest) {
  const allowedOrigins = getAllowedOrigins()
  const origin = req.headers.origin?.replace(/\/$/, '')

  if (allowedOrigins.length === 0) {
    return process.env.NODE_ENV !== 'production'
  }

  return Boolean(origin && allowedOrigins.includes(origin))
}

function getClientIp(req: ApiRequest) {
  const forwardedFor = req.headers['x-forwarded-for']
  const value = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor

  return value?.split(',')[0]?.trim() || 'unknown'
}

function isRateLimited(req: ApiRequest) {
  const now = Date.now()
  const clientIp = getClientIp(req)
  const recentRequests = (requestLog.get(clientIp) ?? []).filter(
    (timestamp) => now - timestamp < rateLimitWindowMs,
  )

  if (recentRequests.length >= rateLimitMaxRequests) {
    requestLog.set(clientIp, recentRequests)
    return true
  }

  requestLog.set(clientIp, [...recentRequests, now])
  return false
}

function getResendError(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }

  return 'Unknown Resend error'
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  setCors(req, res)

  if (!isOriginAllowed(req)) {
    return res.status(403).json({ error: 'Origin is not allowed' })
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (isRateLimited(req)) {
    res.setHeader('Retry-After', String(rateLimitWindowMs / 1000))
    return res.status(429).json({ error: 'Too many requests. Please try again later.' })
  }

  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL

  if (!resendApiKey || resendApiKey === 're_xxxxxxxxx' || !fromEmail) {
    return res.status(500).json({ error: 'Email provider is not configured' })
  }

  const parsed = requestSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request payload' })
  }

  const payload = parsed.data
  const inquiry = payload.request
  const copy = emailCopy[payload.locale]
  const clientBody = appendAutomaticNotice(payload.clientBody, copy.automaticNotice)
  let finalOwnerEmail: string
  try {
    finalOwnerEmail = await resolveReservationOwnerEmail(payload.ownerEmail)
  } catch {
    return res.status(503).json({ error: 'Could not load reservation email settings. Please try again.' })
  }
  const resend = new Resend(resendApiKey)
  const tagValue = payload.reservationNumber.replace(/[^a-zA-Z0-9_-]/g, '_')

  const ownerHtml = wrapEmail(
    `${copy.newInquiry} ${payload.reservationNumber}`,
    `${detailsTable(`
      ${sectionTitle(copy.inquiryDetails)}
      ${row(copy.reservationNumber, payload.reservationNumber)}
      ${row(copy.dates, `${inquiry.checkIn} - ${inquiry.checkOut}`)}
      ${row(copy.nights, inquiry.nights)}
      ${row(copy.guests, inquiry.guests)}
      ${row(copy.rooms, apartmentLabel(getReservationApartment(inquiry), payload.locale))}
      ${sectionTitle(copy.clientDetails)}
      ${row(copy.client, inquiry.fullName)}
      ${row(copy.email, inquiry.email)}
      ${row(copy.phone, inquiry.phone)}
      ${sectionTitle(copy.pricing)}
      ${row(copy.nightlyPrice, `${inquiry.nightlyPrice} ${payload.currency}`)}
      ${row(copy.estimatedTotal, `${inquiry.estimatedTotal} ${payload.currency}`)}
    `)}
    ${messageBoxWithTitle(copy.clientMessage, inquiry.message || '-')}`,
    payload.locale,
  )

  const clientHtml = wrapEmail(
    payload.clientSubject,
    `<div style="font-size:14px;line-height:1.65;color:#2a3328;margin:0 0 22px">
      ${paragraph(clientBody)}
    </div>
    ${detailsTable(`
      ${sectionTitle(copy.inquirySummary)}
      ${row(copy.reservationNumber, payload.reservationNumber)}
      ${row(copy.dates, `${inquiry.checkIn} - ${inquiry.checkOut}`)}
      ${row(copy.nights, inquiry.nights)}
      ${row(copy.guests, inquiry.guests)}
      ${row(copy.estimatedTotal, `${inquiry.estimatedTotal} ${payload.currency}`)}
    `)}`,
    payload.locale,
  )

  const ownerEmailResult = await resend.emails
    .send({
      from: fromEmail,
      to: finalOwnerEmail,
      replyTo: inquiry.email,
      subject: `${payload.ownerSubject} (${payload.reservationNumber})`,
      html: ownerHtml,
      text: [
        `${copy.reservationNumber}: ${payload.reservationNumber}`,
        `${copy.client}: ${inquiry.fullName}`,
        `${copy.email}: ${inquiry.email}`,
        `${copy.phone}: ${inquiry.phone}`,
        `${copy.dates}: ${inquiry.checkIn} - ${inquiry.checkOut}`,
        `${copy.nights}: ${inquiry.nights}`,
        `${copy.guests}: ${inquiry.guests}`,
        `${copy.rooms}: ${apartmentLabel(getReservationApartment(inquiry), payload.locale)}`,
        `${copy.estimatedTotal}: ${inquiry.estimatedTotal} ${payload.currency}`,
        `${copy.message}: ${inquiry.message || '-'}`,
      ].join('\n'),
      tags: [{ name: 'reservation_number', value: tagValue }],
    }, { idempotencyKey: `owner-${payload.reservationNumber}` })
    .catch((error: unknown) => ({ data: null, error: { message: getResendError(error) } }))

  if (ownerEmailResult.error) {
    return res.status(502).json({ error: `Owner email failed: ${ownerEmailResult.error.message}` })
  }

  const clientEmailResult = await resend.emails
    .send({
      from: fromEmail,
      to: payload.clientEmail,
      replyTo: finalOwnerEmail,
      subject: `${payload.clientSubject} - ${payload.reservationNumber}`,
      html: clientHtml,
      text: [
        clientBody,
        '',
        `${copy.inquirySummary}:`,
        `${copy.reservationNumber}: ${payload.reservationNumber}`,
        `${copy.dates}: ${inquiry.checkIn} - ${inquiry.checkOut}`,
        `${copy.nights}: ${inquiry.nights}`,
        `${copy.guests}: ${inquiry.guests}`,
        `${copy.estimatedTotal}: ${inquiry.estimatedTotal} ${payload.currency}`,
      ].join('\n'),
      tags: [{ name: 'reservation_number', value: tagValue }],
    }, { idempotencyKey: `client-${payload.reservationNumber}` })
    .catch((error: unknown) => ({ data: null, error: { message: getResendError(error) } }))

  if (clientEmailResult.error) {
    return res.status(502).json({ error: `Client email failed: ${clientEmailResult.error.message}` })
  }

  return res.status(200).json({
    ok: true,
    reservationNumber: payload.reservationNumber,
    ownerEmailId: ownerEmailResult.data?.id,
    clientEmailId: clientEmailResult.data?.id,
  })
}
