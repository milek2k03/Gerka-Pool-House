import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { contentRepository } from '../services/contentRepository'
import { SiteContentContext, type SiteContentContextValue } from './siteContentContext'

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState(() => contentRepository.loadLocal())

  useEffect(() => {
    let active = true
    let midnightTimer: ReturnType<typeof window.setTimeout> | undefined
    let unsubscribe: () => void = () => {}

    const loadContent = async () => {
      try {
        const next = await contentRepository.load()

        if (active) {
          setContent(next)
        }
      } catch {
        // Keep the local fallback if the remote content cannot be loaded.
      }
    }

    const scheduleMidnightRefresh = () => {
      if (!active) return

      const now = new Date()
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1)

      midnightTimer = window.setTimeout(() => {
        void loadContent().finally(scheduleMidnightRefresh)
      }, nextMidnight.getTime() - now.getTime())
    }

    void loadContent()
    scheduleMidnightRefresh()
    unsubscribe = contentRepository.subscribe(loadContent)

    return () => {
      active = false
      if (midnightTimer) window.clearTimeout(midnightTimer)
      unsubscribe()
    }
  }, [])

  const value = useMemo<SiteContentContextValue>(
    () => ({
      content,
      async saveContent(nextContent) {
        const saved = await contentRepository.save(nextContent)
        setContent(saved)
        return saved
      },
      async resetContent() {
        const next = await contentRepository.reset()
        setContent(next)
        return next
      },
    }),
    [content],
  )

  return (
    <SiteContentContext.Provider value={value}>
      {children}
    </SiteContentContext.Provider>
  )
}
