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

export function HomePage() {
  const { content } = useSiteContent()
  const { i18n } = useTranslation()
  const locale = getLocale(i18n.language)

  return (
    <>
      <Seo settings={content.seo.home} locale={locale} jsonLd={buildHomeSchema(content, locale)} />
      <HeroSection content={content} locale={locale} />
      <AboutSection content={content} locale={locale} />
      <GallerySection items={content.gallery} locale={locale} />
      <AmenitiesSection items={content.amenities} locale={locale} />
      <AreaSection content={content} locale={locale} />
      <PricingSection pricing={content.pricing} locale={locale} />
      <FaqSection items={content.faq} locale={locale} />
      <BookingSection content={content} locale={locale} />
      <ContactSection content={content} locale={locale} />
    </>
  )
}
