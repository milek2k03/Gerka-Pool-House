import type { Locale } from '../types/common'

export const supportedLocales: Locale[] = ['pl', 'en']

export const defaultLocale: Locale = 'pl'

const configuredSiteUrl = (import.meta.env.VITE_SITE_URL ?? 'https://www.gerkapoolhouse.pl').replace(
  /\/$/,
  '',
)

export const siteUrl = configuredSiteUrl.replace(
  /^https:\/\/gerkapoolhouse\.pl$/i,
  'https://www.gerkapoolhouse.pl',
)

export const googleSiteVerification = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION ?? ''

export const navSections = [
  { id: 'about', labelKey: 'nav.about' },
  { id: 'gallery', labelKey: 'nav.gallery' },
  { id: 'amenities', labelKey: 'nav.amenities' },
  { id: 'area', labelKey: 'nav.area' },
  { id: 'pricing', labelKey: 'nav.pricing' },
  { id: 'booking', labelKey: 'nav.booking' },
  { id: 'contact', labelKey: 'nav.contact' },
] as const
