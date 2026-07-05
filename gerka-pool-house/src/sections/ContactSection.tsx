import { Mail, MapPin, Navigation, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { SectionHeading } from '../components/ui/SectionHeading'
import type { Locale } from '../types/common'
import type { SiteContent } from '../types/content'
import { localize } from '../utils/locale'

export function ContactSection({ content, locale }: { content: SiteContent; locale: Locale }) {
  const { t } = useTranslation()
  const hasMapEmbed = content.contact.mapEmbedUrl.includes('google.com/maps') && content.contact.mapEmbedUrl.includes('output=embed')
  const phone = content.contact.phone.trim()
  const secondaryPhone = (content.contact.secondaryPhone ?? '').trim()

  return (
    <section id="contact" className="section-spacing bg-[var(--color-deep)] px-5 sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionHeading
            eyebrow={t('sections.contactEyebrow')}
            title={t('sections.contactTitle')}
            lead={t('sections.contactLead')}
          />
          <div className="mt-8 grid gap-3">
            {phone ? (
              <a
                className="flex items-center gap-3 rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-[var(--color-ink)] shadow-[var(--shadow-soft)] transition hover:-translate-y-1 hover:border-[var(--color-brass)] hover:bg-[var(--color-surface-2)]"
                href={`tel:${phone.replace(/\s/g, '')}`}
              >
                <Phone aria-hidden="true" className="size-5 text-[var(--color-brass)]" />
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    {t('contact.phone')}
                  </span>
                  {phone}
                </span>
              </a>
            ) : null}
            {secondaryPhone ? (
              <a
                className="flex items-center gap-3 rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-[var(--color-ink)] shadow-[var(--shadow-soft)] transition hover:-translate-y-1 hover:border-[var(--color-brass)] hover:bg-[var(--color-surface-2)]"
                href={`tel:${secondaryPhone.replace(/\s/g, '')}`}
              >
                <Phone aria-hidden="true" className="size-5 text-[var(--color-brass)]" />
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    {t('contact.secondaryPhone')}
                  </span>
                  {secondaryPhone}
                </span>
              </a>
            ) : null}
            <a
              className="flex items-center gap-3 rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-[var(--color-ink)] shadow-[var(--shadow-soft)] transition hover:-translate-y-1 hover:border-[var(--color-brass)] hover:bg-[var(--color-surface-2)]"
              href={`mailto:${content.contact.email}`}
            >
              <Mail aria-hidden="true" className="size-5 text-[var(--color-brass)]" />
              <span>
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  {t('contact.email')}
                </span>
                {content.contact.email}
              </span>
            </a>
            <div className="flex items-center gap-3 rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-[var(--color-ink)] shadow-[var(--shadow-soft)]">
              <MapPin aria-hidden="true" className="size-5 text-[var(--color-brass)]" />
              <span>
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  {t('contact.address')}
                </span>
                {localize(content.contact.address, locale)}
              </span>
            </div>
          </div>
        </div>
        <div className="min-h-[360px] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-paper-2)] shadow-[var(--shadow-soft)]">
          {hasMapEmbed ? (
            <iframe
              title={t('contact.mapTitle')}
              src={content.contact.mapEmbedUrl}
              className="h-full min-h-[360px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className="flex min-h-[360px] items-center justify-center p-8 text-center">
              <div className="max-w-md">
                <div className="mx-auto grid size-14 place-items-center rounded-xl bg-[rgba(214,181,138,0.14)] text-[var(--color-brass)]">
                  <Navigation aria-hidden="true" className="size-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-[var(--color-ink)]">{t('contact.mapFallbackTitle')}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{t('contact.mapFallbackBody')}</p>
                <p className="mt-5 text-base font-semibold text-[var(--color-ink)]">
                  {localize(content.contact.address, locale)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
