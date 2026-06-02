export type ReservationStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'

export type AvailabilityStatus = 'booked' | 'unavailable'

export interface AvailabilityRange {
  id: string
  from: string
  to: string
  status: AvailabilityStatus
}

export interface ReservationRequest {
  id: string
  reservationNumber: string
  createdAt: string
  fullName: string
  email: string
  phone: string
  guests: number
  checkIn: string
  checkOut: string
  nights: number
  roomsUsed: number
  nightlyPrice: number
  estimatedTotal: number
  message: string
  status: ReservationStatus
}

export interface StaySummary {
  checkIn: string
  checkOut: string
  guests: number
  nights: number
  roomsUsed: number
  roomLabels: string[]
  nightlyPrice: number
  estimatedTotal: number
  isAvailable: boolean
  isValid: boolean
  reason?: string
}
