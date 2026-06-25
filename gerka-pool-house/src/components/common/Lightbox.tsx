import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, type TouchEvent } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import type { GalleryItem } from '../../types/content'
import type { Locale } from '../../types/common'
import { getSupabaseImageUrl } from '../../utils/imageUrl'
import { localize } from '../../utils/locale'
import { Button } from '../ui/Button'
import { ResponsiveImage } from './ResponsiveImage'

interface LightboxProps {
  items: GalleryItem[]
  activeIndex: number | null
  locale: Locale
  onClose: () => void
  onChange: (index: number) => void
}

export function Lightbox({ items, activeIndex, locale, onClose, onChange }: LightboxProps) {
  const { t } = useTranslation()
  const activeItem = activeIndex === null ? null : items[activeIndex]
  const captionId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const touchStart = useRef({ x: 0, y: 0 })
  const touchEnd = useRef({ x: 0, y: 0 })
  const isOpen = activeIndex !== null && Boolean(activeItem)

  const showPrevious = useCallback(() => {
    if (activeIndex === null) return

    onChange((activeIndex - 1 + items.length) % items.length)
  }, [activeIndex, items.length, onChange])

  const showNext = useCallback(() => {
    if (activeIndex === null) return

    onChange((activeIndex + 1) % items.length)
  }, [activeIndex, items.length, onChange])

  const onTouchStart = (event: TouchEvent) => {
    const touch = event.changedTouches[0]

    touchStart.current = { x: touch.clientX, y: touch.clientY }
    touchEnd.current = { x: touch.clientX, y: touch.clientY }
  }

  const onTouchMove = (event: TouchEvent) => {
    const touch = event.changedTouches[0]

    touchEnd.current = { x: touch.clientX, y: touch.clientY }
  }

  const onTouchEnd = () => {
    const deltaX = touchEnd.current.x - touchStart.current.x
    const deltaY = touchEnd.current.y - touchStart.current.y

    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return

    if (deltaX < 0) {
      showNext()
    } else {
      showPrevious()
    }
  }

  useEffect(() => {
    if (!isOpen) return undefined

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const scrollY = window.scrollY
    const previousPosition = document.body.style.position
    const previousTop = document.body.style.top
    const previousWidth = document.body.style.width
    const previousOverflow = document.body.style.overflow

    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus())

    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.body.style.position = previousPosition
      document.body.style.top = previousTop
      document.body.style.width = previousWidth
      document.body.style.overflow = previousOverflow
      window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' })
      previouslyFocused?.focus({ preventScroll: true })
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return undefined

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') showNext()
      if (event.key === 'ArrowLeft') showPrevious()

      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])',
          ),
        )
        const first = focusable[0]
        const last = focusable.at(-1)

        if (!first || !last) {
          event.preventDefault()
          return
        }

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose, showNext, showPrevious])

  useEffect(() => {
    if (!isOpen || activeIndex === null || items.length < 2) return

    const neighborIndexes = [
      (activeIndex - 1 + items.length) % items.length,
      (activeIndex + 1) % items.length,
    ]

    for (const index of neighborIndexes) {
      const neighbor = items[index]
      if (!neighbor || neighbor.image.type === 'video') continue

      const image = new Image()
      image.decoding = 'async'
      image.src =
        getSupabaseImageUrl(neighbor.image.src, 1200, 'webp', 84) ??
        neighbor.image.avif ??
        neighbor.image.webp ??
        neighbor.image.src
    }
  }, [activeIndex, isOpen, items])

  if (!activeItem || activeIndex === null) return null

  return createPortal(
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[100] grid h-[100dvh] grid-rows-[minmax(0,1fr)] overflow-hidden bg-[rgba(15,23,42,0.94)] p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={localize(activeItem.title, locale)}
      aria-describedby={captionId}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <Button
        ref={closeButtonRef}
        type="button"
        size="icon"
        variant="secondary"
        className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-20 sm:right-6 sm:top-6"
        aria-label={t('common.close')}
        onClick={onClose}
      >
        <X aria-hidden="true" className="size-5" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="absolute left-3 top-1/2 z-20 -translate-y-1/2 sm:left-6"
        aria-label={t('common.previousImage')}
        onClick={showPrevious}
      >
        <ChevronLeft aria-hidden="true" className="size-5" />
      </Button>
      <figure
        className="mx-auto grid h-full min-h-0 w-full max-w-6xl touch-pan-y select-none grid-rows-[minmax(0,1fr)_auto] items-center gap-3 px-12 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-12 sm:gap-4 sm:px-14 sm:pb-0 sm:pt-0"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="grid h-full min-h-0 w-full place-items-center">
          {activeItem.image.type === 'video' ? (
            <video
              key={activeItem.id}
              className="h-full min-h-0 w-full rounded-[var(--radius-card)] bg-[var(--color-paper)] object-contain shadow-[var(--shadow-premium)]"
              src={activeItem.image.src}
              poster={activeItem.image.poster}
              controls
              playsInline
              preload="metadata"
            />
          ) : (
            <ResponsiveImage
              key={activeItem.id}
              image={activeItem.image}
              alt={localize(activeItem.alt, locale)}
              className="h-full min-h-0 w-full rounded-[var(--radius-card)] bg-[var(--color-paper)] shadow-[var(--shadow-premium)]"
              imgClassName="object-contain"
              loading="eager"
              fetchPriority="high"
              profile="fullscreen"
              sizes="90vw"
            />
          )}
        </div>
        <figcaption id={captionId} className="text-center text-sm font-medium text-white sm:text-base">
          {localize(activeItem.title, locale)}
        </figcaption>
      </figure>
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="absolute right-3 top-1/2 z-20 -translate-y-1/2 sm:right-6"
        aria-label={t('common.nextImage')}
        onClick={showNext}
      >
        <ChevronRight aria-hidden="true" className="size-5" />
      </Button>
    </div>,
    document.body,
  )
}
