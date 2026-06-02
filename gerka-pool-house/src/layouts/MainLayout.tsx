import { Outlet } from 'react-router'
import { useTranslation } from 'react-i18next'

import { Footer } from '../components/common/Footer'
import { Header } from '../components/common/Header'

export function MainLayout() {
  const { t } = useTranslation()

  return (
    <>
      <a href="#main" className="skip-link">
        {t('common.skipToContent')}
      </a>
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
