import { useTranslation } from 'react-i18next'

import { useSiteContent } from '../../hooks/useSiteContent'
import { getLocale, localize } from '../../utils/locale'
import { FacebookIcon, InstagramIcon } from './Icon'
import { Logo } from './Logo'

export function Footer() {
  const { t, i18n } = useTranslation()
  const { content } = useSiteContent()
  const locale = getLocale(i18n.language)
  const facebookUrl = content.contact.facebookUrl.trim()
  const instagramUrl = content.contact.instagramUrl.trim()

  return (
    <footer className="bg-[var(--color-paper)] px-5 py-14 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <Logo />
          <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--color-muted)]">{localize(content.hero.slogan, locale)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          {facebookUrl ? (
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('contact.openFacebook')}
              className="grid size-11 place-items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-brass)] transition hover:border-[var(--color-brass)] hover:bg-[var(--color-surface-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brass)]"
            >
              <FacebookIcon />
            </a>
          ) : null}
          {instagramUrl ? (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('contact.openInstagram')}
              className="grid size-11 place-items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-brass)] transition hover:border-[var(--color-brass)] hover:bg-[var(--color-surface-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brass)]"
            >
              <InstagramIcon />
            </a>
          ) : null}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full px-3 py-2 text-sm text-[var(--color-muted)] transition hover:text-white"
          >
            {t('footer.privacy')}
          </a>
          <a
            href="/cookies"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full px-3 py-2 text-sm text-[var(--color-muted)] transition hover:text-white"
          >
            {t('footer.cookies')}
          </a>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-[var(--color-border)] pt-6 text-sm text-[rgba(203,213,225,0.80)]">
        &copy; {new Date().getFullYear()} {content.brandName}. {t('footer.copyright')}
      </div>
    </footer>
  )
}
