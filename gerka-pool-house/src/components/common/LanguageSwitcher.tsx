import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { getLocale } from '../../utils/locale'
import { Button } from '../ui/Button'

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const currentLocale = getLocale(i18n.language)
  const nextLocale = currentLocale === 'pl' ? 'en' : 'pl'

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      className="min-h-10 border-white/20 bg-white/16 px-3 text-white backdrop-blur-xl hover:bg-white/24"
      aria-label={`${t('common.language')}: ${nextLocale.toUpperCase()}`}
      onClick={() => void i18n.changeLanguage(nextLocale)}
    >
      <Languages aria-hidden="true" className="size-4" />
      {nextLocale.toUpperCase()}
    </Button>
  )
}
