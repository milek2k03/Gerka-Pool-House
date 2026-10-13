import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { getTodayISO } from '../utils/date'
import { contentRepository } from '../services/contentRepository'
import { SiteContentContext, type SiteContentContextValue } from './siteContentContext'

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const sequence = useRef(0)
  const [content, setContent] = useState(() => contentRepository.loadLocal())

  useEffect(() => {
    let active = true
    let midnightTimer: ReturnType<typeof window.setTimeout> | undefined
    let unsubscribe: () => void = () => {}

    const loadContent = async () => {
      const request = ++sequence.current
      try {
        const next = await contentRepository.load()

        if (active && request === sequence.current) {
          setContent(next)
        }
      } catch {
        // Keep the local fallback if the remote content cannot be loaded.
      }
    }

    let lastDay = getTodayISO()
    const scheduleMidnightRefresh = () => {
      if (!active) return
      midnightTimer = window.setTimeout(() => {
        const day = getTodayISO()
        if (day !== lastDay) { lastDay = day; void loadContent() }
        scheduleMidnightRefresh()
      }, 60_000)
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
        sequence.current++
        setContent(saved)
        return saved
      },
      async refreshContent() {
        const next = await contentRepository.load({ requireRemote: true })
        sequence.current++
        setContent(next)
        return next
      },
      async resetContent() {
        const next = await contentRepository.reset(content)
        sequence.current++
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
