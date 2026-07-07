import { siteUrl } from '../config/site'
import type { Locale } from '../types/common'
import type { SiteContent } from '../types/content'
import { localize } from './locale'
import { applyGuestLimitToText, isApartment2Enabled } from './pricing'

function absoluteUrl(path: string) {
  if (!path) return siteUrl
  if (path.startsWith('http')) return path
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`
}

export function buildHomeSchema(content: SiteContent, locale: Locale) {
  const homeUrl = absoluteUrl(content.seo.home.canonicalPath)
  const image = absoluteUrl(content.seo.home.ogImage ?? content.hero.image.src)
  const logo = absoluteUrl('/social-logo.png')
  const address = localize(content.contact.address, locale)
  const telephone = content.contact.phone.trim()
  const sameAs = [content.contact.facebookUrl, content.contact.instagramUrl].filter(
    (url): url is string => Boolean(url),
  )
  const priceRange = isApartment2Enabled(content.pricing)
    ? `${content.pricing.room1Nightly}-${content.pricing.room1Nightly + content.pricing.room2Nightly} PLN`
    : `${content.pricing.room1Nightly} PLN`

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        '@id': `${homeUrl}#localbusiness`,
        name: content.brandName,
        image,
        logo,
        url: homeUrl,
        ...(sameAs.length ? { sameAs } : {}),
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
        logo,
        url: homeUrl,
        ...(sameAs.length ? { sameAs } : {}),
        ...(telephone ? { telephone } : {}),
        email: content.contact.email,
        priceRange,
        checkinTime: '15:00',
        checkoutTime: '12:00',
        amenityFeature: content.amenities.map((amenity) => ({
          '@type': 'LocationFeatureSpecification',
          name: localize(amenity.title, locale),
          value: true,
        })),
      },
      {
        '@type': 'FAQPage',
        '@id': `${homeUrl}#faq`,
        mainEntity: content.faq.map((item) => {
          const answer = localize(item.answer, locale)

          return {
            '@type': 'Question',
            name: localize(item.question, locale),
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.id === 'capacity' ? applyGuestLimitToText(answer, content.pricing) : answer,
            },
          }
        }),
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
