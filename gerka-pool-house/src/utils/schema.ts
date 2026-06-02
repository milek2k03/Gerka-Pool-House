import { siteUrl } from '../config/site'
import type { Locale } from '../types/common'
import type { SiteContent } from '../types/content'
import { localize } from './locale'

function absoluteUrl(path: string) {
  if (!path) return siteUrl
  if (path.startsWith('http')) return path
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`
}

export function buildHomeSchema(content: SiteContent, locale: Locale) {
  const homeUrl = absoluteUrl(content.seo.home.canonicalPath)
  const image = absoluteUrl(content.seo.home.ogImage ?? content.hero.image.src)
  const address = localize(content.contact.address, locale)
  const telephone = content.contact.phone.trim()

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        '@id': `${homeUrl}#localbusiness`,
        name: content.brandName,
        image,
        url: homeUrl,
        ...(telephone ? { telephone } : {}),
        email: content.contact.email,
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'PL',
          streetAddress: address,
        },
      },
      {
        '@type': 'LodgingBusiness',
        '@id': `${homeUrl}#lodging`,
        name: content.brandName,
        image,
        url: homeUrl,
        ...(telephone ? { telephone } : {}),
        email: content.contact.email,
        priceRange: `${content.pricing.room1Nightly}-${content.pricing.room1Nightly + content.pricing.room2Nightly} PLN`,
        amenityFeature: content.amenities.map((amenity) => ({
          '@type': 'LocationFeatureSpecification',
          name: localize(amenity.title, locale),
          value: true,
        })),
      },
      {
        '@type': 'FAQPage',
        '@id': `${homeUrl}#faq`,
        mainEntity: content.faq.map((item) => ({
          '@type': 'Question',
          name: localize(item.question, locale),
          acceptedAnswer: {
            '@type': 'Answer',
            text: localize(item.answer, locale),
          },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${homeUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: content.brandName,
            item: homeUrl,
          },
        ],
      },
    ],
  }
}
