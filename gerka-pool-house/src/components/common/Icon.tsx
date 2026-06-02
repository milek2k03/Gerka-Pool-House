import {
  Car,
  FlameKindling,
  Landmark,
  Leaf,
  Map,
  ParkingCircle,
  Route,
  ShowerHead,
  Sparkles,
  Trees,
  Utensils,
  Waves,
  Wifi,
  type LucideIcon,
} from 'lucide-react'

import type { IconKey } from '../../types/content'

const icons: Record<IconKey, LucideIcon> = {
  pool: Waves,
  grill: FlameKindling,
  garden: Trees,
  parking: ParkingCircle,
  wifi: Wifi,
  relax: Sparkles,
  lake: ShowerHead,
  route: Route,
  restaurant: Utensils,
  landmark: Landmark,
}

export function FeatureIcon({ icon }: { icon: IconKey }) {
  const Icon = icons[icon] ?? Leaf
  return <Icon aria-hidden="true" className="size-5" strokeWidth={1.8} />
}

export function MapIcon() {
  return <Map aria-hidden="true" className="size-5" strokeWidth={1.8} />
}

export function CarIcon() {
  return <Car aria-hidden="true" className="size-5" strokeWidth={1.8} />
}

export function FacebookIcon() {
  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14.5 8.2V6.9c0-.7.5-.9 1-.9h1.8V3h-2.5c-2.8 0-4.4 1.7-4.4 4.5v.7H8v3.1h2.4V21h4.1v-9.7h2.8l.4-3.1h-3.2Z" />
    </svg>
  )
}

export function InstagramIcon() {
  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="none">
      <rect width="16" height="16" x="4" y="4" rx="4.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="2" />
      <circle cx="16.8" cy="7.2" r="1.1" fill="currentColor" />
    </svg>
  )
}
