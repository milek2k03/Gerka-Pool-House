import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { changeAppLanguage } from '../../app/i18n'
import { cn } from '../../utils/cn'
import { getLocale } from '../../utils/locale'
import { Button } from '../ui/Button'

interface LanguageSwitcherProps {
  className?: string
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation()
  const currentLocale = getLocale(i18n.language)
  const nextLocale = currentLocale === 'pl' ? 'en' : 'pl'

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      className={cn('min-h-10 px-3 backdrop-blur-xl', className)}
      aria-label={`${t('common.language')}: ${nextLocale.toUpperCase()}`}
      onClick={() => void changeAppLanguage(nextLocale)}
    >
      <Languages aria-hidden="true" className="size-4" />
      {nextLocale.toUpperCase()}
    </Button>
  )
}
