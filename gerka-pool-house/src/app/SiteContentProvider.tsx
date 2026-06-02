import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { contentRepository } from '../services/contentRepository'
import { SiteContentContext, type SiteContentContextValue } from './siteContentContext'

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState(() => contentRepository.loadLocal())

  useEffect(() => {
    let active = true

    const loadContent = async () => {
      const next = await contentRepository.load()

      if (active) {
        setContent(next)
      }
    }

    void loadContent()
    const unsubscribe = contentRepository.subscribe(loadContent)

    return () => {
      active = false
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

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>
}
