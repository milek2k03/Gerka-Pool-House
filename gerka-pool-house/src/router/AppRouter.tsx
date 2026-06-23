import { lazy } from 'react'
import { Route, Routes } from 'react-router'

import { MainLayout } from '../layouts/MainLayout'
import { HomePage } from '../pages/HomePage'

const AdminPage = lazy(() => import('../admin/AdminPage').then((module) => ({ default: module.AdminPage })))
const PrivacyPage = lazy(() => import('../pages/PrivacyPage').then((module) => ({ default: module.PrivacyPage })))
const CookiesPage = lazy(() => import('../pages/CookiesPage').then((module) => ({ default: module.CookiesPage })))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))

export function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="cookies" element={<CookiesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="admin" element={<AdminPage />} />
    </Routes>
  )
}
