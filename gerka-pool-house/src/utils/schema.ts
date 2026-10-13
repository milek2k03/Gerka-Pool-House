import { resolveSiteContent } from './contentTemplates'
import { siteUrl } from '../config/site'
import type { Locale } from '../types/common'
import type { SiteContent } from '../types/content'
import { localize } from './locale'
import { getBothApartmentsNightly, getStayTimes, isApartment2Enabled } from './pricing'

function absoluteUrl(path: string) {
  if (!path) return siteUrl
  if (path.startsWith('http')) return path
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`
}

export function buildHomeSchema(rawContent: SiteContent, locale: Locale) {
  const content = resolveSiteContent(rawContent)
  const times = getStayTimes(content.pricing)
  const homeUrl = absoluteUrl(content.seo.home.canonicalPath)
  const image = absoluteUrl(content.seo.home.ogImage || content.hero.image.src)
  const logo = absoluteUrl('/social-logo.png')
  const address = localize(content.contact.address, locale)
  const telephone = content.contact.phone.trim()
  const sameAs = [content.contact.facebookUrl, content.contact.instagramUrl].filter(
    (url): url is string => Boolean(url),
  )
  const rates = isApartment2Enabled(content.pricing)
    ? [content.pricing.room1Nightly, content.pricing.room2Nightly, getBothApartmentsNightly(content.pricing)]
    : [content.pricing.room1Nightly]
  const priceRange = rates.length > 1
    ? `${Math.min(...rates)}-${Math.max(...rates)} ${content.pricing.currency}`
    : `${rates[0]} ${content.pricing.currency}`

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
        checkinTime: times.checkIn,
        checkoutTime: times.checkOut,
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
              text: answer,
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
