import { useMemo } from 'react'

import type { Locale } from '../types/common'
import type { SiteContent } from '../types/content'
import { isApartment2Enabled } from '../utils/pricing'
import { AboutSection } from './AboutSection'
import { AmenitiesSection } from './AmenitiesSection'
import { AreaSection } from './AreaSection'
import { BookingSection } from './BookingSection'
import { ContactSection } from './ContactSection'
import { FaqSection } from './FaqSection'
import { GallerySection } from './GallerySection'
import { PricingSection } from './PricingSection'

export function HomeDeferredSections({ content, locale }: { content: SiteContent; locale: Locale }) {
  const visibleGallerySections = useMemo(
    () =>
      isApartment2Enabled(content.pricing)
        ? content.gallerySections
        : content.gallerySections.filter((section) => section.id !== 'apartment-2'),
    [content.gallerySections, content.pricing],
  )

  return (
    <>
      <AboutSection content={content} locale={locale} />
      <GallerySection sections={visibleGallerySections} locale={locale} />
      <AmenitiesSection items={content.amenities} locale={locale} />
      <AreaSection content={content} locale={locale} />
      <PricingSection pricing={content.pricing} locale={locale} />
      <BookingSection content={content} locale={locale} />
      <FaqSection items={content.faq} locale={locale} pricing={content.pricing} />
      <ContactSection content={content} locale={locale} />
    </>
  )
}
