import { Suspense, useEffect } from 'react'
import { BrowserRouter } from 'react-router'

import './i18n'
import { SiteContentProvider } from './SiteContentProvider'
import { AppRouter } from '../router/AppRouter'
import { useSiteContent } from '../hooks/useSiteContent'
import { initAnalytics } from '../services/analytics'

function SiteLoading() {
  const { content } = useSiteContent()
  return <div className="grid min-h-screen place-items-center">{content.brandName}</div>
}

export function App() {
  useEffect(() => {
    const timer = window.setTimeout(initAnalytics, 5000)

    return () => window.clearTimeout(timer)
  }, [])

  return (
    <SiteContentProvider>
      <BrowserRouter>
        <Suspense fallback={<SiteLoading />}>
          <AppRouter />
        </Suspense>
      </BrowserRouter>
    </SiteContentProvider>
  )
}
