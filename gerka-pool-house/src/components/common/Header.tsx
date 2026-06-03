import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { navSections } from '../../config/site'
import { cn } from '../../utils/cn'
import { AnchorButton, Button } from '../ui/Button'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Logo } from './Logo'

export function Header() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      <div className="mx-auto flex min-w-0 max-w-7xl items-center justify-between gap-2 rounded-[1.5rem] border border-[var(--color-border)] bg-[rgba(15,23,42,0.75)] px-3 py-2.5 text-white shadow-[0_20px_55px_rgba(0,0,0,0.22)] backdrop-blur-[20px] sm:px-4">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {navSections.map((item) => (
            <a
              key={item.id}
              href={`/#${item.id}`}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-white/84 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brass)]"
            >
              {t(item.labelKey)}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          <AnchorButton href="/#booking" size="sm">
            {t('common.bookNow')}
          </AnchorButton>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-white hover:bg-white/10 lg:hidden"
          aria-label={open ? t('common.closeMenu') : t('common.openMenu')}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
        </Button>
      </div>

      <div
        className={cn(
          'mx-auto mt-2 max-w-7xl rounded-[1.35rem] border border-[var(--color-border)] bg-[rgba(15,23,42,0.90)] p-3 text-white shadow-[0_20px_55px_rgba(0,0,0,0.24)] backdrop-blur-[20px] lg:hidden',
          open ? 'block' : 'hidden',
        )}
      >
        <nav className="grid gap-1" aria-label="Mobile">
          {navSections.map((item) => (
            <a
              key={item.id}
              href={`/#${item.id}`}
              onClick={close}
              className="rounded-xl px-3 py-3 text-base font-medium text-white/88 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brass)]"
            >
              {t(item.labelKey)}
            </a>
          ))}
        </nav>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <LanguageSwitcher />
          <AnchorButton href="/#booking" onClick={close}>
            {t('common.bookNow')}
          </AnchorButton>
        </div>
      </div>
    </header>
  )
}
