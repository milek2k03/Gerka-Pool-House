import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { defaultLocale } from '../config/site'
import { pl } from '../locales/pl/translation'
import type { Locale } from '../types/common'
import { getLocale } from '../utils/locale'

const queryLanguage =
  typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('lng') : undefined
const initialLocale = getLocale(queryLanguage ?? defaultLocale)
const resources: Record<string, { translation: Record<string, unknown> }> = {
  pl: { translation: pl },
}

if (initialLocale === 'en') {
  const { en } = await import('../locales/en/translation')
  resources.en = { translation: en }
}

await i18n.use(initReactI18next).init({
  resources,
  lng: initialLocale,
  fallbackLng: defaultLocale,
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (language) => {
  const locale = getLocale(language)
  const url = new URL(window.location.href)

  document.documentElement.lang = locale
  window.localStorage.setItem('gerka-pool-house:language', locale)

  if (locale === defaultLocale) {
    url.searchParams.delete('lng')
  } else {
    url.searchParams.set('lng', locale)
  }

  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
})

export async function changeAppLanguage(locale: Locale) {
  if (locale === 'en' && !i18n.hasResourceBundle('en', 'translation')) {
    const { en } = await import('../locales/en/translation')
    i18n.addResourceBundle('en', 'translation', en, true, true)
  }

  await i18n.changeLanguage(locale)
}

export { i18n }
