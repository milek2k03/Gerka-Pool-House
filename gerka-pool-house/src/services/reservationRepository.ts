import type { AvailabilityRange, ReservationRequest, ReservationStatus } from '../types/booking'
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient'

const tableName = 'reservation_requests'
const storageKey = 'gerka-pool-house:reservation-requests:v3'
const legacyStorageKeys = ['gerka-pool-house:reservation-requests:v1', 'gerka-pool-house:reservation-requests:v2']
export const reservationsChangedEventName = 'gerka:reservations:changed'
const reservationsBroadcastChannelName = 'gerka-reservations'
let legacyStorageCleaned = false

interface ReservationRow {
  id: string
  reservation_number: string
  created_at: string
  full_name: string
  email: string
  phone: string
  guests: number
  check_in: string
  check_out: string
  nights: number
  rooms_used: number
  nightly_price: number
  estimated_total: number
  message: string | null
  status: ReservationStatus
}

function generateReservationNumber() {
  const date = new Date()
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('')
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `GPH-${stamp}-${suffix}`
}

function read(): ReservationRequest[] {
  if (typeof window === 'undefined') return []

  try {
    if (!legacyStorageCleaned) {
      legacyStorageKeys.forEach((key) => window.localStorage.removeItem(key))
      legacyStorageCleaned = true
    }

    return JSON.parse(window.localStorage.getItem(storageKey) ?? '[]') as ReservationRequest[]
  } catch {
    return []
  }
}

function fromRow(row: ReservationRow): ReservationRequest {
  return {
    id: row.id,
    reservationNumber: row.reservation_number,
    createdAt: row.created_at,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    guests: Number(row.guests),
    checkIn: row.check_in,
    checkOut: row.check_out,
    nights: Number(row.nights),
    roomsUsed: Number(row.rooms_used),
    nightlyPrice: Number(row.nightly_price),
    estimatedTotal: Number(row.estimated_total),
    message: row.message ?? '',
    status: row.status,
  }
}

function toRow(request: ReservationRequest): ReservationRow {
  return {
    id: request.id,
    reservation_number: request.reservationNumber,
    created_at: request.createdAt,
    full_name: request.fullName,
    email: request.email,
    phone: request.phone,
    guests: request.guests,
    check_in: request.checkIn,
    check_out: request.checkOut,
    nights: request.nights,
    rooms_used: request.roomsUsed,
    nightly_price: request.nightlyPrice,
    estimated_total: request.estimatedTotal,
    message: request.message,
    status: request.status,
  }
}

function notifyReservationsChanged() {
  window.dispatchEvent(new CustomEvent(reservationsChangedEventName))

  if ('BroadcastChannel' in window) {
    const channel = new BroadcastChannel(reservationsBroadcastChannelName)
    channel.postMessage({ type: reservationsChangedEventName })
    channel.close()
  }
}

function write(items: ReservationRequest[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(items))
  notifyReservationsChanged()
}

async function listFromSupabase() {
  const supabase = await getSupabaseClient()

  if (!supabase) return []

  const { data, error } = await supabase
    .from(tableName)
    .select(
      'id,reservation_number,created_at,full_name,email,phone,guests,check_in,check_out,nights,rooms_used,nightly_price,estimated_total,message,status',
    )
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => fromRow(row as ReservationRow))
}

function asAvailability(items: Pick<ReservationRequest, 'checkIn' | 'checkOut' | 'id'>[]): AvailabilityRange[] {
  return items.map((item) => ({
    id: `reservation-${item.id}`,
    from: item.checkIn,
    to: item.checkOut,
    status: 'booked',
  }))
}

async function acceptedReservationsAsAvailability(): Promise<AvailabilityRange[]> {
  const supabase = await getSupabaseClient()

  if (supabase) {
    const { data, error } = await supabase
      .from(tableName)
      .select('id,check_in,check_out,status')
      .eq('status', 'accepted')
      .order('check_in', { ascending: true })

    if (error) throw error

    return (data ?? []).map((row) => ({
      id: `reservation-${String(row.id)}`,
      from: String(row.check_in),
      to: String(row.check_out),
      status: 'booked',
    }))
  }

  return asAvailability(read().filter((item) => item.status === 'accepted'))
}

export const reservationRepository = {
  async list() {
    if (isSupabaseConfigured) {
      return listFromSupabase()
    }

    return read()
  },
  listAcceptedAvailability: acceptedReservationsAsAvailability,
  reservationsChangedEventName,
  reservationsBroadcastChannelName,

  async add(request: Omit<ReservationRequest, 'id' | 'reservationNumber' | 'createdAt' | 'status'>) {
    const next: ReservationRequest = {
      ...request,
      id: crypto.randomUUID(),
      reservationNumber: generateReservationNumber(),
      createdAt: new Date().toISOString(),
      status: 'pending',
    }

    const supabase = await getSupabaseClient()

    if (supabase) {
      const { error } = await supabase.from(tableName).insert(toRow(next))

      if (error) throw error

      notifyReservationsChanged()
      return next
    }

    write([next, ...read()])
    return next
  },

  async updateStatus(id: string, status: ReservationStatus) {
    const supabase = await getSupabaseClient()

    if (supabase) {
      const { error } = await supabase
        .from(tableName)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      notifyReservationsChanged()
      return listFromSupabase()
    }

    const next = read().map((item) => (item.id === id ? { ...item, status } : item))
    write(next)
    return next
  },

  subscribe(onChange: () => void | Promise<void>) {
    if (typeof window === 'undefined') return () => undefined

    const notify = () => {
      void onChange()
    }

    window.addEventListener('storage', notify)
    window.addEventListener(reservationsChangedEventName, notify)

    const broadcastChannel = 'BroadcastChannel' in window ? new BroadcastChannel(reservationsBroadcastChannelName) : null

    if (broadcastChannel) {
      broadcastChannel.onmessage = (event) => {
        if (event.data?.type === reservationsChangedEventName) {
          notify()
        }
      }
    }

    let active = true
    let cleanupSupabase: (() => void) | null = null

    if (isSupabaseConfigured) {
      void getSupabaseClient().then((supabaseClient) => {
        if (!active || !supabaseClient) return

        const supabaseChannel = supabaseClient
          .channel('reservation-requests-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, notify)
          .subscribe()

        cleanupSupabase = () => {
          void supabaseClient.removeChannel(supabaseChannel)
        }
      })
    }

    return () => {
      active = false
      window.removeEventListener('storage', notify)
      window.removeEventListener(reservationsChangedEventName, notify)
      broadcastChannel?.close()
      cleanupSupabase?.()
    }
  },
}
