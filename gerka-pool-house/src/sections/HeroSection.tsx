import { ArrowDown, CalendarCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

import { ResponsiveImage } from '../components/common/ResponsiveImage'
import { AnchorButton } from '../components/ui/Button'
import type { Locale } from '../types/common'
import type { SiteContent } from '../types/content'
import { localize } from '../utils/locale'

export function HeroSection({ content, locale }: { content: SiteContent; locale: Locale }) {
  const { t } = useTranslation()
  const poolHighlight = content.about.highlights.find((item) => item.id === 'private-pool')
  const contactLine = content.contact.phone.trim() || content.contact.email

  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-[var(--color-deep)] text-white">
      <ResponsiveImage
        image={content.hero.image}
        alt=""
        className="absolute inset-0 -z-20 h-full w-full"
        loading="eager"
        fetchPriority="high"
        imgClassName="object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(18,22,18,0.72),rgba(18,22,18,0.34)_46%,rgba(18,22,18,0.15)),linear-gradient(0deg,rgba(18,22,18,0.72),rgba(18,22,18,0)_36%)]" />
      <div className="mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-5 pb-8 pt-28 sm:px-8 lg:px-10">
        <motion.div
          className="max-w-3xl pb-10 sm:pb-16"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/76">
            {localize(content.hero.eyebrow, locale)}
          </p>
          <h1 className="text-5xl font-semibold leading-[1.04] text-white sm:text-6xl lg:text-7xl">
            {content.brandName}
          </h1>
          <p className="mt-5 max-w-2xl text-xl leading-8 text-white/90 sm:text-2xl">
            {localize(content.hero.slogan, locale)}
          </p>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/76 sm:text-lg">
            {localize(content.hero.lead, locale)}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <AnchorButton href="#booking" size="lg">
              <CalendarCheck aria-hidden="true" className="size-5" />
              {t('common.bookNow')}
            </AnchorButton>
            <AnchorButton href="#about" size="lg" variant="secondary" className="border-white/30 bg-white/10 text-white hover:bg-white/18">
              <ArrowDown aria-hidden="true" className="size-5" />
              {t('common.seeOffer')}
            </AnchorButton>
          </div>
        </motion.div>
        <div className="grid gap-2 border-t border-white/18 pt-4 text-sm text-white/72 sm:grid-cols-3">
          <span>{t('pricing.maxGuests', { count: content.pricing.maxGuests })}</span>
          <span>{poolHighlight ? localize(poolHighlight.title, locale) : localize(content.hero.eyebrow, locale)}</span>
          <span>{contactLine}</span>
        </div>
      </div>
    </section>
  )
}
