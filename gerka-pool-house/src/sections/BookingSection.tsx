import { useTranslation } from 'react-i18next'

import { BookingForm } from '../features/booking/BookingForm'
import { SectionHeading } from '../components/ui/SectionHeading'
import type { Locale } from '../types/common'
import type { SiteContent } from '../types/content'
import { localize } from '../utils/locale'

export function BookingSection({ content, locale }: { content: SiteContent; locale: Locale }) {
  const { t } = useTranslation()

  return (
    <section id="booking" className="section-spacing bg-[var(--color-paper)] px-4 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow={t('sections.bookingEyebrow')}
          title={localize(content.booking.title, locale)}
          lead={localize(content.booking.lead, locale)}
          align="center"
        />
        <div className="mt-10">
          <BookingForm content={content} locale={locale} />
        </div>
      </div>
    </section>
  )
}
