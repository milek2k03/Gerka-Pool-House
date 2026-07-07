import { Menu, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'

import { navSections } from '../../config/site'
import { cn } from '../../utils/cn'
import { AnchorButton, Button } from '../ui/Button'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Logo } from './Logo'

export function Header() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const barRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)

  const updateHeaderHeight = useCallback(() => {
    const height = barRef.current?.getBoundingClientRect().height ?? 84
    document.documentElement.style.setProperty('--site-header-height', `${Math.ceil(height)}px`)
  }, [])

  const getHeaderOffset = useCallback(() => {
    const height = barRef.current?.getBoundingClientRect().height ?? 84
    return Math.ceil(height + 14)
  }, [])

  const scrollToSection = useCallback(
    (id: string) => {
      const run = (attempt = 0) => {
        const target = document.getElementById(id)

        if (!target) {
          if (attempt < 40) {
            window.setTimeout(() => run(attempt + 1), 50)
          }
          return
        }

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - getHeaderOffset())

        window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' })

        window.setTimeout(() => {
          const settledTarget = document.getElementById(id)
          if (!settledTarget) return

          const settledTop = Math.max(
            0,
            window.scrollY + settledTarget.getBoundingClientRect().top - getHeaderOffset(),
          )
          if (Math.abs(settledTop - window.scrollY) > 4) {
            window.scrollTo({ top: settledTop, behavior: 'auto' })
          }
        }, 520)
      }

      run()
    },
    [getHeaderOffset],
  )

  const handleSectionClick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault()
    close()

    const hash = `#${id}`
    if (location.pathname !== '/' || location.hash !== hash) {
      navigate({ pathname: '/', hash })
    }

    window.setTimeout(() => scrollToSection(id), 0)
  }

  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    updateHeaderHeight()

    const element = barRef.current
    const resizeObserver = element && 'ResizeObserver' in window ? new ResizeObserver(updateHeaderHeight) : null

    if (element) resizeObserver?.observe(element)
    window.addEventListener('resize', updateHeaderHeight)

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updateHeaderHeight)
    }
  }, [updateHeaderHeight])

  useEffect(() => {
    if (location.pathname !== '/' || !location.hash) return undefined

    const id = decodeURIComponent(location.hash.slice(1))
    const timeout = window.setTimeout(() => scrollToSection(id), 80)

    return () => window.clearTimeout(timeout)
  }, [location.hash, location.pathname, scrollToSection])

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 sm:px-6" data-site-header>
      <div
        ref={barRef}
        className="mx-auto flex min-w-0 max-w-7xl items-center justify-between gap-1.5 rounded-b-[1.5rem] rounded-t-none border border-t-0 border-[var(--color-border)] bg-[rgba(15,23,42,0.75)] px-2 py-2.5 text-white shadow-[0_20px_55px_rgba(0,0,0,0.22)] backdrop-blur-[20px] sm:gap-2 sm:px-4"
      >
        <Logo />
        <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary">
          {navSections.map((item) => (
            <a
              key={item.id}
              href={`/#${item.id}`}
              onClick={(event) => handleSectionClick(event, item.id)}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-white/84 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brass)]"
            >
              {t(item.labelKey)}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          <AnchorButton href="/#booking" size="sm" onClick={(event) => handleSectionClick(event, 'booking')}>
            {t('common.bookNow')}
          </AnchorButton>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 md:hidden">
          <LanguageSwitcher className="min-h-10 px-2 text-xs" />
          <AnchorButton
            href="/#booking"
            size="sm"
            onClick={(event) => handleSectionClick(event, 'booking')}
            className="min-h-10 whitespace-nowrap px-2 text-xs"
          >
            {t('common.bookNow')}
          </AnchorButton>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-10 shrink-0 text-white hover:bg-white/10 sm:size-11 xl:hidden"
          aria-label={open ? t('common.closeMenu') : t('common.openMenu')}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
        </Button>
      </div>

      <div
        id="mobile-navigation"
        className={cn(
          'mx-auto mt-2 max-w-7xl rounded-[1.35rem] border border-[var(--color-border)] bg-[rgba(15,23,42,0.90)] p-3 text-white shadow-[0_20px_55px_rgba(0,0,0,0.24)] backdrop-blur-[20px] xl:hidden',
          open ? 'block' : 'hidden',
        )}
      >
        <nav className="grid gap-1" aria-label="Mobile">
          {navSections.map((item) => (
            <a
              key={item.id}
              href={`/#${item.id}`}
              onClick={(event) => handleSectionClick(event, item.id)}
              className="rounded-xl px-3 py-3 text-base font-medium text-white/88 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brass)]"
            >
              {t(item.labelKey)}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}
