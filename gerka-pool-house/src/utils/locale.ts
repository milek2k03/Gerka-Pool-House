import { defaultLocale, supportedLocales } from '../config/site'
import type { Locale, LocalizedString } from '../types/common'

export function getLocale(value?: string): Locale {
  const normalized = value?.split('-')[0]
  return supportedLocales.includes(normalized as Locale) ? (normalized as Locale) : defaultLocale
}

export function localize(value: LocalizedString, locale: Locale): string {
  return value[locale] || value[defaultLocale] || ''
}
