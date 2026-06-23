import { lazy, Suspense, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Seo } from '../components/common/Seo'
import { useSiteContent } from '../hooks/useSiteContent'
import { HeroSection } from '../sections/HeroSection'
import { buildHomeSchema } from '../utils/schema'
import { getLocale } from '../utils/locale'
import { applyGuestLimitToText } from '../utils/pricing'

const HomeDeferredSections = lazy(() =>
  import('../sections/HomeDeferredSections').then((module) => ({ default: module.HomeDeferredSections })),
)

export function HomePage() {
  const { content } = useSiteContent()
  const { i18n } = useTranslation()
  const locale = getLocale(i18n.language)
  const homeSeo = useMemo(
    () => ({
      ...content.seo.home,
      description: {
        pl: applyGuestLimitToText(content.seo.home.description.pl, content.pricing),
        en: applyGuestLimitToText(content.seo.home.description.en, content.pricing),
      },
    }),
    [content.pricing, content.seo.home],
  )

  return (
    <>
      <Seo settings={homeSeo} locale={locale} jsonLd={buildHomeSchema(content, locale)} />
      <HeroSection content={content} locale={locale} />
      <Suspense fallback={null}>
        <HomeDeferredSections content={content} locale={locale} />
      </Suspense>
    </>
  )
}
