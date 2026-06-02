import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect } from 'react'
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

  useEffect(() => {
    if (activeIndex === null) return undefined

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') onChange((activeIndex + 1) % items.length)
      if (event.key === 'ArrowLeft') onChange((activeIndex - 1 + items.length) % items.length)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [activeIndex, items.length, onChange, onClose])

  if (!activeItem || activeIndex === null) return null

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-black/86 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={localize(activeItem.title, locale)}
    >
      <Button
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
        onClick={() => onChange((activeIndex - 1 + items.length) % items.length)}
      >
        <ChevronLeft aria-hidden="true" className="size-5" />
      </Button>
      <figure className="w-full max-w-6xl">
        {activeItem.image.type === 'video' ? (
          <video
            className="aspect-[16/10] w-full rounded-md bg-black object-contain"
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
            className="aspect-[16/10] rounded-md bg-black"
            imgClassName="object-contain"
            sizes="90vw"
          />
        )}
        <figcaption className="mt-4 text-center text-sm font-medium text-white">
          {localize(activeItem.title, locale)}
        </figcaption>
      </figure>
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="absolute right-4 top-1/2 hidden -translate-y-1/2 sm:inline-flex"
        aria-label={t('common.nextImage')}
        onClick={() => onChange((activeIndex + 1) % items.length)}
      >
        <ChevronRight aria-hidden="true" className="size-5" />
      </Button>
    </div>
  )
}
