import { useEffect } from 'react'

import { googleSiteVerification, siteUrl } from '../../config/site'
import type { Locale } from '../../types/common'
import type { SeoPageSettings } from '../../types/content'
import { localize } from '../../utils/locale'

interface SeoProps {
  settings: SeoPageSettings
  locale: Locale
  jsonLd?: object
  noindex?: boolean
}

function resolveUrl(value?: string) {
  if (!value) return undefined
  if (value.startsWith('http')) return value
  return `${siteUrl}${value.startsWith('/') ? value : `/${value}`}`
}

function upsertMeta(attribute: 'name' | 'property', key: string, content?: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)

  if (!content) {
    element?.remove()
    return
  }

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.content = content
}

function upsertLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`
  let element = document.head.querySelector<HTMLLinkElement>(selector)
  if (!element) {
    element = document.createElement('link')
    element.rel = rel
    if (hreflang) element.hreflang = hreflang
    document.head.appendChild(element)
  }
  element.href = href
}

export function Seo({ settings, locale, jsonLd, noindex }: SeoProps) {
  useEffect(() => {
    const title = localize(settings.title, locale)
    const description = localize(settings.description, locale)
    const canonical = resolveUrl(settings.canonicalPath) ?? siteUrl
    const image = resolveUrl(settings.ogImage)

    document.title = title
    document.documentElement.lang = locale

    upsertMeta('name', 'description', description)
    upsertMeta('name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow')
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:site_name', 'Gerka Pool House')
    upsertMeta('property', 'og:url', canonical)
    upsertMeta('property', 'og:locale', locale === 'pl' ? 'pl_PL' : 'en_US')
    upsertMeta('property', 'og:locale:alternate', locale === 'pl' ? 'en_US' : 'pl_PL')
    upsertMeta('name', 'twitter:title', title)
    upsertMeta('name', 'twitter:description', description)
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('property', 'og:image', image)
    upsertMeta('property', 'og:image:secure_url', image)
    upsertMeta('property', 'og:image:type', image ? 'image/jpeg' : undefined)
    upsertMeta('property', 'og:image:width', image ? '1200' : undefined)
    upsertMeta('property', 'og:image:height', image ? '630' : undefined)
    upsertMeta('property', 'og:image:alt', title)
    upsertMeta('name', 'twitter:image', image)
    upsertMeta('name', 'twitter:image:alt', title)
    upsertMeta('name', 'thumbnail', image)
    if (googleSiteVerification) {
      upsertMeta('name', 'google-site-verification', googleSiteVerification)
    }

    upsertLink('canonical', canonical)
    upsertLink('alternate', `${siteUrl}${settings.canonicalPath}`, 'pl')
    upsertLink('alternate', `${siteUrl}${settings.canonicalPath}?lng=en`, 'en')
    upsertLink('alternate', `${siteUrl}${settings.canonicalPath}`, 'x-default')
    if (image) {
      upsertLink('image_src', image)
    }

    const scriptId = 'structured-data'
    document.getElementById(scriptId)?.remove()
    if (jsonLd) {
      const script = document.createElement('script')
      script.id = scriptId
      script.type = 'application/ld+json'
      script.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(script)
    }
  }, [jsonLd, locale, noindex, settings])

  return null
}
