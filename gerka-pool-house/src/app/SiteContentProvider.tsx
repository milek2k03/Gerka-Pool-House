import { useEffect, useMemo, useState, type ReactNode } from 'react'

import logoMark from '../assets/images/gerka-logo.png'
import { contentRepository } from '../services/contentRepository'
import { isSupabaseConfigured } from '../services/supabaseClient'
import { SiteContentContext, type SiteContentContextValue } from './siteContentContext'

function SiteContentBootScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-[var(--color-deep)] px-6 text-center text-[var(--color-ink)]">
      <div className="grid justify-items-center gap-5">
        <div className="grid h-20 w-32 place-items-center rounded-[1.25rem] border border-[var(--color-border)] bg-white/8 p-2 shadow-[var(--shadow-soft)] backdrop-blur">
          <img src={logoMark} alt="" className="h-full w-full object-contain" decoding="async" />
        </div>
        <div>
          <p className="font-heading text-2xl font-semibold">Gerka Pool House</p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">Ładujemy aktualną wersję strony...</p>
        </div>
        <span className="h-1.5 w-32 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
          <span className="block h-full w-1/2 animate-[loader-slide_1.1s_ease-in-out_infinite] rounded-full bg-[var(--color-brass)]" />
        </span>
      </div>
    </div>
  )
}

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState(() => contentRepository.loadLocal())
  const [isBootstrapping, setIsBootstrapping] = useState(
    () => isSupabaseConfigured && !contentRepository.hasLocalContent(),
  )

  useEffect(() => {
    let active = true
    let midnightTimer: ReturnType<typeof window.setTimeout> | undefined

    const loadContent = async () => {
      try {
        const next = await contentRepository.load()

        if (active) {
          setContent(next)
        }
      } catch {
        // Keep the local fallback if the remote content cannot be loaded.
      } finally {
        if (active) {
          setIsBootstrapping(false)
        }
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
    const unsubscribe = contentRepository.subscribe(loadContent)

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
      {isBootstrapping ? <SiteContentBootScreen /> : children}
    </SiteContentContext.Provider>
  )
}
