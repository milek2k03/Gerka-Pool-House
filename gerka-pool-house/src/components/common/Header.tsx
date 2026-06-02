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
    <header className="fixed inset-x-0 top-0 z-50 px-2 pt-2 sm:px-5 sm:pt-3">
      <div className="mx-auto flex min-w-0 max-w-7xl items-center justify-between gap-2 rounded-md border border-white/20 bg-[rgba(7,10,8,0.72)] px-2 py-2 text-white shadow-lg shadow-black/30 backdrop-blur-xl sm:px-3">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {navSections.map((item) => (
            <a
              key={item.id}
              href={`/#${item.id}`}
              className="rounded-md px-3 py-2 text-sm font-medium text-white/84 transition hover:bg-white/12 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
          className="shrink-0 text-white hover:bg-white/14 lg:hidden"
          aria-label={open ? t('common.closeMenu') : t('common.openMenu')}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
        </Button>
      </div>

      <div
        className={cn(
          'mx-auto mt-2 max-w-7xl rounded-md border border-white/20 bg-[rgba(7,10,8,0.92)] p-3 text-white shadow-xl backdrop-blur-xl lg:hidden',
          open ? 'block' : 'hidden',
        )}
      >
        <nav className="grid gap-1" aria-label="Mobile">
          {navSections.map((item) => (
            <a
              key={item.id}
              href={`/#${item.id}`}
              onClick={close}
              className="rounded-md px-3 py-3 text-base font-medium text-white/88 hover:bg-white/12 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
