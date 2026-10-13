import { bookingLimits } from '../../constants/bookingLimits'
import { z } from 'zod'

export const bookingSchema = z.object({
  apartment: z.enum(['ground', 'upper', 'both']).default('ground'),
  checkIn: z.string().date('validation.invalidDate'),
  checkOut: z.string().date('validation.invalidDate'),
  guests: z.coerce.number().int().min(1, 'validation.minGuests').max(bookingLimits.maxGuests, 'booking.guestLimit'),
  fullName: z.string().trim().min(2, 'validation.fullName').max(bookingLimits.fullName, 'validation.fullNameMax'),
  email: z.string().trim().email('validation.email'),
  phone: z.string().trim().min(6, 'validation.phone').max(bookingLimits.phone, 'validation.phoneMax'),
  discountCode: z.string().trim().max(40, 'validation.discountCodeMax').optional().default(''),
  message: z.string().trim().max(bookingLimits.message, 'validation.messageMax').optional().default(''),
  privacyConsent: z.boolean().refine(Boolean, 'validation.privacyConsent'),
})

export type BookingFormInput = z.input<typeof bookingSchema>
export type BookingFormValues = z.output<typeof bookingSchema>
