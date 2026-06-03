import { ArrowDown, CalendarCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

import { ResponsiveImage } from '../components/common/ResponsiveImage'
import { AnchorButton } from '../components/ui/Button'
import type { Locale } from '../types/common'
import type { SiteContent } from '../types/content'
import { localize } from '../utils/locale'
import { applyGuestLimitToText, getEffectiveMaxGuests } from '../utils/pricing'

export function HeroSection({ content, locale }: { content: SiteContent; locale: Locale }) {
  const { t } = useTranslation()
  const poolHighlight = content.about.highlights.find((item) => item.id === 'private-pool')
  const contactLine = content.contact.phone.trim() || content.contact.email
  const maxGuests = getEffectiveMaxGuests(content.pricing)

  return (
    <section className="relative isolate overflow-hidden bg-[var(--color-deep)] text-white sm:min-h-[100svh]">
      <ResponsiveImage
        image={content.hero.image}
        mobileImage={content.hero.mobileImage}
        alt=""
        className="absolute inset-x-0 top-0 -z-20 h-[58svh] w-full bg-[var(--color-deep)] sm:inset-0 sm:h-full"
        loading="eager"
        fetchPriority="high"
        imgClassName="object-cover object-[63%_48%] sm:object-cover sm:object-center"
      />
      <div className="absolute inset-x-0 top-0 -z-10 h-[58svh] bg-[linear-gradient(rgba(15,23,42,0.55),rgba(15,23,42,0.35))] sm:inset-0 sm:h-full" />
      <div className="mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-5 pb-8 pt-[62svh] sm:px-8 sm:pt-28 lg:px-10">
        <motion.div
          className="max-w-xl pb-10 sm:pb-16 lg:ml-auto lg:max-w-2xl lg:text-right"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--color-brass)]">
            {localize(content.hero.eyebrow, locale)}
          </p>
          <h1 className="text-4xl font-semibold leading-[1.04] text-white sm:text-6xl lg:text-7xl">
            {content.brandName}
          </h1>
          <p className="mt-5 max-w-xl text-xl leading-8 text-white/90 sm:text-2xl lg:ml-auto">
            {localize(content.hero.slogan, locale)}
          </p>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/76 sm:text-lg lg:ml-auto">
            {applyGuestLimitToText(localize(content.hero.lead, locale), content.pricing)}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:justify-end">
            <AnchorButton href="#booking" size="lg">
              <CalendarCheck aria-hidden="true" className="size-5" />
              {t('common.bookNow')}
            </AnchorButton>
            <AnchorButton href="#about" size="lg" variant="secondary">
              <ArrowDown aria-hidden="true" className="size-5" />
              {t('common.seeOffer')}
            </AnchorButton>
          </div>
        </motion.div>
        <div className="grid gap-2 border-t border-[var(--color-border)] pt-4 text-sm text-white/78 sm:grid-cols-3">
          <span>{t('pricing.maxGuests', { count: maxGuests })}</span>
          <span>{poolHighlight ? localize(poolHighlight.title, locale) : localize(content.hero.eyebrow, locale)}</span>
          <span>{contactLine}</span>
        </div>
      </div>
    </section>
  )
}
