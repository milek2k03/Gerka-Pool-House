import { z } from 'zod'

export const bookingSchema = z.object({
  checkIn: z.string().min(1, 'validation.required'),
  checkOut: z.string().min(1, 'validation.required'),
  guests: z.coerce.number().int().min(1, 'validation.minGuests'),
  fullName: z.string().trim().min(2, 'validation.fullName'),
  email: z.string().trim().email('validation.email'),
  phone: z.string().trim().min(6, 'validation.phone'),
  discountCode: z.string().trim().max(40, 'validation.discountCodeMax').optional().default(''),
  message: z.string().trim().max(1000, 'validation.messageMax').optional().default(''),
  privacyConsent: z.boolean().refine(Boolean, 'validation.privacyConsent'),
})

export type BookingFormInput = z.input<typeof bookingSchema>
export type BookingFormValues = z.output<typeof bookingSchema>
