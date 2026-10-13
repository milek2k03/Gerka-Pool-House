import type { AvailabilityRange } from './booking'
import type { LocalizedString } from './common'

export type IconKey =
  | 'pool'
  | 'grill'
  | 'firepit'
  | 'garden'
  | 'parking'
  | 'wifi'
  | 'relax'
  | 'lake'
  | 'route'
  | 'restaurant'
  | 'landmark'

export interface ImageAsset {
  src: string
  type?: 'image' | 'video'
  webp?: string
  avif?: string
  poster?: string
  storagePath?: string
  mimeType?: string
  size?: number
}

export interface GalleryItem {
  id: string
  title: LocalizedString
  alt: LocalizedString
  image: ImageAsset
}

export interface GallerySection {
  id: string
  title: LocalizedString
  lead: LocalizedString
  items: GalleryItem[]
}

export interface FeatureItem {
  id: string
  icon: IconKey
  title: LocalizedString
  description: LocalizedString
}

export interface AreaItem {
  id: string
  icon: IconKey
  title: LocalizedString
  description: LocalizedString
  distance: LocalizedString
}

export interface AreaInfoItem {
  id: string
  title: LocalizedString
  description: LocalizedString
  distance: LocalizedString
  details?: LocalizedString[]
  link?: {
    label: LocalizedString
    href: string
  }
}

export interface FaqItem {
  id: string
  question: LocalizedString
  answer: LocalizedString
}

export interface PriceSettings {
  room1Nightly: number
  room2Nightly: number
  bothNightly?: number
  checkInTime?: string
  checkOutTime?: string
  weeksaveBaseNightly?: number
  weeksaveExtraGuestNightly?: number
  room2Enabled: boolean
  room1Capacity: number
  maxGuests: number
  minStayNights: number
  currency: 'PLN'
  discounts: DiscountCode[]
  extraInfo: LocalizedString
}

export interface DiscountCode {
  id: string
  code: string
  percent: number
  type: DiscountCodeType
  validFrom?: string
  validTo?: string
  weekdays?: DiscountWeekday[]
}

export type DiscountCodeType = 'permanent' | 'dateRange' | 'recurring'

export type DiscountWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

export interface ContactSettings {
  phone: string
  secondaryPhone?: string
  email: string
  address: LocalizedString
  mapEmbedUrl: string
  facebookUrl: string
  instagramUrl: string
}

export interface SeoPageSettings {
  title: LocalizedString
  description: LocalizedString
  canonicalPath: string
  ogImage?: string
}

export interface SeoSettings {
  home: SeoPageSettings
  admin: SeoPageSettings
  privacy: SeoPageSettings
  cookies: SeoPageSettings
}

export interface SiteContent {
  version: number
  brandName: string
  logoText: string
  hero: {
    eyebrow: LocalizedString
    slogan: LocalizedString
    lead: LocalizedString
    image: ImageAsset
    mobileImage?: ImageAsset
    mobileUsesDesktop?: boolean
  }
  about: {
    title: LocalizedString
    lead: LocalizedString
    body: LocalizedString
    highlights: FeatureItem[]
  }
  gallery: GalleryItem[]
  gallerySections: GallerySection[]
  amenities: FeatureItem[]
  area: {
    title: LocalizedString
    lead: LocalizedString
    items: AreaItem[]
    restaurants: AreaInfoItem[]
    nearby: AreaInfoItem[]
    busRoutes: AreaInfoItem[]
    airports: AreaInfoItem[]
    bikeRoutes: {
      title: LocalizedString
      lead: LocalizedString
      routes: LocalizedString[]
    }
    image: ImageAsset
  }
  pricing: PriceSettings
  faq: FaqItem[]
  booking: {
    title: LocalizedString
    lead: LocalizedString
    ownerEmail: string
    confirmationSubject: LocalizedString
    confirmationBody: LocalizedString
  }
  contact: ContactSettings
  availability: AvailabilityRange[]
  seo: SeoSettings
  updatedAt: string
}
