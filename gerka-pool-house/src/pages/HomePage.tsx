import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Seo } from '../components/common/Seo'
import { useSiteContent } from '../hooks/useSiteContent'
import { AboutSection } from '../sections/AboutSection'
import { AmenitiesSection } from '../sections/AmenitiesSection'
import { AreaSection } from '../sections/AreaSection'
import { BookingSection } from '../sections/BookingSection'
import { ContactSection } from '../sections/ContactSection'
import { FaqSection } from '../sections/FaqSection'
import { GallerySection } from '../sections/GallerySection'
import { HeroSection } from '../sections/HeroSection'
import { PricingSection } from '../sections/PricingSection'
import { buildHomeSchema } from '../utils/schema'
import { getLocale } from '../utils/locale'
import { applyGuestLimitToText, isApartment2Enabled } from '../utils/pricing'

export function HomePage() {
  const { content } = useSiteContent()
  const { i18n } = useTranslation()
  const locale = getLocale(i18n.language)
  const homeSeo = useMemo(
    () => ({
      ...content.seo.home,
      description: {
        pl: applyGuestLimitToText(content.seo.home.description.pl, content.pricing),
        en: applyGuestLimitToText(content.seo.home.description.en, content.pricing),
      },
    }),
    [content.pricing, content.seo.home],
  )
  const visibleGallerySections = useMemo(
    () =>
      isApartment2Enabled(content.pricing)
        ? content.gallerySections
        : content.gallerySections.filter((section) => section.id !== 'apartment-2'),
    [content.gallerySections, content.pricing],
  )

  return (
    <>
      <Seo settings={homeSeo} locale={locale} jsonLd={buildHomeSchema(content, locale)} />
      <HeroSection content={content} locale={locale} />
      <AboutSection content={content} locale={locale} />
      <GallerySection sections={visibleGallerySections} locale={locale} />
      <AmenitiesSection items={content.amenities} locale={locale} />
      <AreaSection content={content} locale={locale} />
      <PricingSection pricing={content.pricing} locale={locale} />
      <FaqSection items={content.faq} locale={locale} pricing={content.pricing} />
      <BookingSection content={content} locale={locale} />
      <ContactSection content={content} locale={locale} />
    </>
  )
}
