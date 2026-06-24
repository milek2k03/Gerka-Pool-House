import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
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

function useDeferredSectionsReady() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let idleCallbackId: number | undefined
    let timeoutId: number | undefined
    const browserWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
      cancelIdleCallback?: (handle: number) => void
    }

    const activate = () => setReady(true)
    const schedule = () => {
      if (browserWindow.requestIdleCallback) {
        idleCallbackId = browserWindow.requestIdleCallback(activate, { timeout: 1200 })
      } else {
        timeoutId = browserWindow.setTimeout(activate, 400)
      }
    }

    if (document.readyState === 'complete') {
      schedule()
    } else {
      window.addEventListener('load', schedule, { once: true })
    }

    window.addEventListener('scroll', activate, { once: true, passive: true })
    window.addEventListener('touchstart', activate, { once: true, passive: true })
    window.addEventListener('pointerdown', activate, { once: true, passive: true })

    return () => {
      window.removeEventListener('load', schedule)
      window.removeEventListener('scroll', activate)
      window.removeEventListener('touchstart', activate)
      window.removeEventListener('pointerdown', activate)
      if (idleCallbackId !== undefined) browserWindow.cancelIdleCallback?.(idleCallbackId)
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    }
  }, [])

  return ready
}

export function HomePage() {
  const { content } = useSiteContent()
  const { i18n } = useTranslation()
  const locale = getLocale(i18n.language)
  const deferredSectionsReady = useDeferredSectionsReady()
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
  const homeSchema = useMemo(() => buildHomeSchema(content, locale), [content, locale])

  return (
    <>
      <Seo settings={homeSeo} locale={locale} jsonLd={homeSchema} />
      <HeroSection content={content} locale={locale} />
      {deferredSectionsReady ? (
        <Suspense fallback={null}>
          <HomeDeferredSections content={content} locale={locale} />
        </Suspense>
      ) : null}
    </>
  )
}
