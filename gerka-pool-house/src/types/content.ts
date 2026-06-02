import type { AvailabilityRange } from './booking'
import type { LocalizedString } from './common'

export type IconKey =
  | 'pool'
  | 'grill'
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

export interface FaqItem {
  id: string
  question: LocalizedString
  answer: LocalizedString
}

export interface PriceSettings {
  room1Nightly: number
  room2Nightly: number
  room1Capacity: number
  maxGuests: number
  minStayNights: number
  currency: 'PLN'
  extraInfo: LocalizedString
}

export interface ContactSettings {
  phone: string
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
  }
  about: {
    title: LocalizedString
    lead: LocalizedString
    body: LocalizedString
    highlights: FeatureItem[]
  }
  gallery: GalleryItem[]
  amenities: FeatureItem[]
  area: {
    title: LocalizedString
    lead: LocalizedString
    items: AreaItem[]
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
