import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { defaultLocale } from '../config/site'
import { en } from '../locales/en/translation'
import { pl } from '../locales/pl/translation'
import { getLocale } from '../utils/locale'

const savedLanguage =
  typeof window !== 'undefined' ? window.localStorage.getItem('gerka-pool-house:language') : undefined

i18n.use(initReactI18next).init({
  resources: {
    pl: { translation: pl },
    en: { translation: en },
  },
  lng: getLocale(savedLanguage ?? navigator.language),
  fallbackLng: defaultLocale,
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = getLocale(language)
  window.localStorage.setItem('gerka-pool-house:language', getLocale(language))
})

export { i18n }
