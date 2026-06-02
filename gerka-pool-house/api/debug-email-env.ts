/// <reference types="node" />

import { loadLocalEnv } from './_env.js'

loadLocalEnv()

interface ApiRequest {
  method?: string
}

interface ApiResponse {
  status: (statusCode: number) => {
    json: (body: unknown) => void
  }
}

export default function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const resendApiKey = process.env.RESEND_API_KEY

  return res.status(200).json({
    hasResendApiKey: Boolean(resendApiKey),
    resendApiKeyIsPlaceholder: resendApiKey === 're_xxxxxxxxx',
    resendApiKeyLength: resendApiKey?.length ?? 0,
    hasResendFromEmail: Boolean(process.env.RESEND_FROM_EMAIL),
    resendFromEmail: process.env.RESEND_FROM_EMAIL ?? null,
    hasReservationOwnerEmail: Boolean(process.env.RESERVATION_OWNER_EMAIL),
    allowedOrigin: process.env.ALLOWED_ORIGIN ?? null,
    nodeEnv: process.env.NODE_ENV ?? null,
  })
}
