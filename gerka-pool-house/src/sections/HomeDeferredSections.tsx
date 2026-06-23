import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'

import type { Locale } from '../types/common'
import type { SiteContent } from '../types/content'
import { isApartment2Enabled } from '../utils/pricing'
import { localize } from '../utils/locale'
import { AboutSection } from './AboutSection'
import { AmenitiesSection } from './AmenitiesSection'
import { AreaSection } from './AreaSection'
import { ContactSection } from './ContactSection'
import { FaqSection } from './FaqSection'
import { GallerySection } from './GallerySection'
import { PricingSection } from './PricingSection'

const BookingSection = lazy(() =>
  import('./BookingSection').then((module) => ({ default: module.BookingSection })),
)

function BookingPlaceholder({ content, locale }: { content: SiteContent; locale: Locale }) {
  return (
    <section id="booking" className="bg-[var(--color-paper)] px-4 py-20 sm:px-8 lg:px-10 lg:py-[120px]">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] px-6 py-10 text-center shadow-[var(--shadow-soft)] sm:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-brass)]">
            {locale === 'pl' ? 'Rezerwacje' : 'Bookings'}
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold text-[var(--color-ink)] sm:text-5xl">
            {localize(content.booking.title, locale)}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[var(--color-muted)] sm:text-lg">
            {localize(content.booking.lead, locale)}
          </p>
        </div>
      </div>
    </section>
  )
}

function LazyBookingSection({ content, locale }: { content: SiteContent; locale: Locale }) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    if (shouldLoad) return

    const element = wrapperRef.current
    if (!element || !('IntersectionObserver' in window)) {
      setShouldLoad(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { rootMargin: '900px 0px' },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [shouldLoad])

  return (
    <div ref={wrapperRef}>
      {shouldLoad ? (
        <Suspense fallback={<BookingPlaceholder content={content} locale={locale} />}>
          <BookingSection content={content} locale={locale} />
        </Suspense>
      ) : (
        <BookingPlaceholder content={content} locale={locale} />
      )}
    </div>
  )
}

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
      <FaqSection items={content.faq} locale={locale} pricing={content.pricing} />
      <LazyBookingSection content={content} locale={locale} />
      <ContactSection content={content} locale={locale} />
    </>
  )
}
