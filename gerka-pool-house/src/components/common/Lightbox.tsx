import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, type TouchEvent } from 'react'
import { useTranslation } from 'react-i18next'

import type { GalleryItem } from '../../types/content'
import type { Locale } from '../../types/common'
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
    if (activeIndex === null) return undefined

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
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

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus())

    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus()
    }
  }, [activeIndex, onClose, showNext, showPrevious])

  if (!activeItem || activeIndex === null) return null

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[70] grid place-items-center bg-[rgba(15,23,42,0.88)] p-4 backdrop-blur-sm"
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
        className="absolute right-4 top-4"
        aria-label={t('common.close')}
        onClick={onClose}
      >
        <X aria-hidden="true" className="size-5" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="absolute left-4 top-1/2 hidden -translate-y-1/2 sm:inline-flex"
        aria-label={t('common.previousImage')}
        onClick={showPrevious}
      >
        <ChevronLeft aria-hidden="true" className="size-5" />
      </Button>
      <figure
        className="w-full max-w-6xl touch-pan-y select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {activeItem.image.type === 'video' ? (
          <video
            className="h-[70svh] w-full rounded-[var(--radius-card)] bg-[var(--color-paper)] object-contain shadow-[var(--shadow-premium)] sm:aspect-[16/10] sm:h-auto"
            src={activeItem.image.src}
            poster={activeItem.image.poster}
            controls
            playsInline
            preload="metadata"
          />
        ) : (
          <ResponsiveImage
            image={activeItem.image}
            alt={localize(activeItem.alt, locale)}
            className="h-[70svh] rounded-[var(--radius-card)] bg-[var(--color-paper)] shadow-[var(--shadow-premium)] sm:aspect-[16/10] sm:h-auto"
            imgClassName="object-contain"
            sizes="90vw"
          />
        )}
        <figcaption id={captionId} className="mt-4 text-center text-sm font-medium text-white">
          {localize(activeItem.title, locale)}
        </figcaption>
      </figure>
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="absolute right-4 top-1/2 hidden -translate-y-1/2 sm:inline-flex"
        aria-label={t('common.nextImage')}
        onClick={showNext}
      >
        <ChevronRight aria-hidden="true" className="size-5" />
      </Button>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-3 sm:hidden">
        <Button type="button" size="icon" variant="secondary" aria-label={t('common.previousImage')} onClick={showPrevious}>
          <ChevronLeft aria-hidden="true" className="size-5" />
        </Button>
        <Button type="button" size="icon" variant="secondary" aria-label={t('common.nextImage')} onClick={showNext}>
          <ChevronRight aria-hidden="true" className="size-5" />
        </Button>
      </div>
    </div>
  )
}
