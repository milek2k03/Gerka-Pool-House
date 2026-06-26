import { ArrowDown, CalendarCheck, Globe2, Mail, MessageCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ResponsiveImage } from '../components/common/ResponsiveImage'
import { AnchorButton } from '../components/ui/Button'
import type { Locale } from '../types/common'
import type { SiteContent } from '../types/content'
import { localize } from '../utils/locale'
import { applyGuestLimitToText } from '../utils/pricing'

interface HeroContactItem {
  href: string
  icon: LucideIcon
  label: string
  value: string
}

export function HeroSection({ content, locale }: { content: SiteContent; locale: Locale }) {
  const { t } = useTranslation()
  const siteUrl =
    (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/^https?:\/\//, '').replace(/\/$/, '') ??
    'www.gerkapoolhouse.pl'
  const phone = content.contact.phone.trim()
  const email = content.contact.email.trim()
  const phoneDigits = phone.replace(/\D/g, '')
  const contactItems: HeroContactItem[] = [
    {
      href: `https://${siteUrl}`,
      icon: Globe2,
      label: 'WWW',
      value: siteUrl,
    },
    phone
      ? {
          href: phoneDigits ? `https://wa.me/${phoneDigits}` : `tel:${phone}`,
          icon: MessageCircle,
          label: 'WhatsApp',
          value: phone,
        }
      : null,
    email
      ? {
          href: `mailto:${email}`,
          icon: Mail,
          label: 'E-mail',
          value: email,
        }
      : null,
  ].filter((item): item is HeroContactItem => Boolean(item))

  const heroImage = import.meta.env.PROD
    ? { ...content.hero.image, src: '/api/hero-image?variant=desktop', avif: undefined, webp: undefined }
    : content.hero.image
  const mobileHeroImage = import.meta.env.PROD
    ? {
        ...(content.hero.mobileImage ?? content.hero.image),
        src: '/api/hero-image?variant=mobile',
        avif: undefined,
        webp: undefined,
      }
    : content.hero.mobileImage

  return (
    <section className="relative isolate overflow-hidden bg-[var(--color-deep)] text-white sm:min-h-[100svh]">
      <ResponsiveImage
        image={heroImage}
        mobileImage={mobileHeroImage}
        alt=""
        className="hero-image-shell absolute inset-x-0 top-0 -z-20 h-[58svh] w-full bg-[var(--color-deep)] sm:inset-0 sm:h-full"
        loading="eager"
        fetchPriority="high"
        hideOnError
        imgClassName="object-cover object-[63%_48%] sm:object-cover sm:object-center"
      />
      <div className="absolute inset-x-0 top-0 -z-10 h-[58svh] bg-[linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.2))] sm:inset-0 sm:h-full sm:bg-[radial-gradient(circle_at_72%_44%,rgba(15,23,42,0.02),rgba(15,23,42,0.28)_42%,rgba(5,11,24,0.76)_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 hidden bg-[linear-gradient(90deg,rgba(4,10,21,0.88)_0%,rgba(15,23,42,0.68)_31%,rgba(15,23,42,0.18)_62%,rgba(15,23,42,0.28)_100%)] sm:block" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-[linear-gradient(180deg,transparent,rgba(5,11,24,0.72))]" />

      <div className="mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-5 pb-6 pt-[62svh] sm:px-8 sm:pb-8 sm:pt-28 lg:px-10">
        <div className="hero-content-desktop hero-poster-copy max-w-xl pb-8 sm:pb-10 lg:max-w-2xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.26em] text-[var(--color-brass)]">
            {localize(content.hero.eyebrow, locale)}
          </p>
          <h1 className="text-5xl font-semibold leading-[0.98] text-white drop-shadow-[0_10px_24px_rgba(0,0,0,0.36)] sm:text-6xl lg:text-7xl">
            {content.brandName}
          </h1>
          <p className="mt-5 max-w-xl text-xl leading-8 text-white/92 sm:text-2xl">
            {localize(content.hero.slogan, locale)}
          </p>
          <div className="my-6 h-px w-full max-w-sm bg-[linear-gradient(90deg,var(--color-brass),rgba(214,181,138,0.08))]" />
          <p className="max-w-xl text-base leading-7 text-white/78 sm:text-lg">
            {applyGuestLimitToText(localize(content.hero.lead, locale), content.pricing)}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <AnchorButton href="#booking" size="lg">
              <CalendarCheck aria-hidden="true" className="size-5" />
              {t('common.bookNow')}
            </AnchorButton>
            <AnchorButton href="#about" size="lg" variant="secondary">
              <ArrowDown aria-hidden="true" className="size-5" />
              {t('common.seeOffer')}
            </AnchorButton>
          </div>
        </div>

        {contactItems.length > 0 ? (
          <div className="hero-contact-strip rounded-[28px] border border-[rgba(214,181,138,0.42)] bg-[rgba(5,11,24,0.62)] p-3 shadow-[0_22px_70px_rgba(0,0,0,0.32)] backdrop-blur-xl">
            {contactItems.map((item) => {
              const Icon = item.icon

              return (
                <a
                  key={item.label}
                  href={item.href}
                  className="hero-contact-item group flex min-w-0 items-center gap-4 px-3 py-4 text-white/86 transition hover:text-white"
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                  rel={item.href.startsWith('http') ? 'noreferrer' : undefined}
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-full border border-[rgba(214,181,138,0.72)] text-[var(--color-brass)] transition group-hover:border-[var(--color-brass)] group-hover:bg-[rgba(214,181,138,0.12)]">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-brass)]">
                      {item.label}
                    </span>
                    <span className="mt-1 block truncate text-sm sm:text-base">{item.value}</span>
                  </span>
                </a>
              )
            })}
          </div>
        ) : null}
      </div>
    </section>
  )
}
