/// <reference types="node" />
import { z } from 'zod'

// Read the recipient from trusted admin-saved content, never from a public payload
// when a production content database is configured.
export async function resolveReservationOwnerEmail(payloadEmail: string) {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return process.env.RESERVATION_OWNER_EMAIL || payloadEmail

  const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/site_content?id=eq.main&select=content`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(6000),
  })
  if (!response.ok) throw new Error('Could not load booking settings')
  const rows = await response.json() as Array<{ content?: { booking?: { ownerEmail?: string } } }>
  const owner = z.email().safeParse(rows[0]?.content?.booking?.ownerEmail)
  if (!owner.success) throw new Error('Invalid reservation owner email in saved settings')
  return owner.data
}
