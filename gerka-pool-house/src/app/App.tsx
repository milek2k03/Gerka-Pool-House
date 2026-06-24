import { Suspense, useEffect } from 'react'
import { BrowserRouter } from 'react-router'

import './i18n'
import { SiteContentProvider } from './SiteContentProvider'
import { AppRouter } from '../router/AppRouter'
import { initAnalytics } from '../services/analytics'

export function App() {
  useEffect(() => {
    const timer = window.setTimeout(initAnalytics, 5000)

    return () => window.clearTimeout(timer)
  }, [])

  return (
    <SiteContentProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="grid min-h-screen place-items-center">Gerka Pool House</div>}>
          <AppRouter />
        </Suspense>
      </BrowserRouter>
    </SiteContentProvider>
  )
}
