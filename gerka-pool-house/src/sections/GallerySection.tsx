import { Maximize2, Play } from 'lucide-react'
import { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Lightbox } from '../components/common/Lightbox'
import { ResponsiveImage } from '../components/common/ResponsiveImage'
import { SectionHeading } from '../components/ui/SectionHeading'
import type { Locale } from '../types/common'
import type { GalleryItem, GallerySection as GallerySectionContent } from '../types/content'
import { cn } from '../utils/cn'
import { localize } from '../utils/locale'

const GalleryMosaic = memo(function GalleryMosaic({
  items,
  locale,
  onOpen,
}: {
  items: GalleryItem[]
  locale: Locale
  onOpen: (index: number) => void
}) {
  const { t } = useTranslation()
  const visibleItems = items.slice(0, 5)
  const hiddenItemsCount = Math.max(0, items.length - visibleItems.length)

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
      {visibleItems.map((item, index) => {
        const isMoreTrigger = hiddenItemsCount > 0 && index === visibleItems.length - 1

        return (
          <button
            key={item.id}
            type="button"
            className={cn(
              'group relative aspect-square overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-paper-2)] text-left shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-premium)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brass)]',
              index === 0 && 'col-span-2 row-span-2',
              'lg:aspect-[4/5] lg:first:col-span-2 lg:first:row-span-2 lg:first:aspect-auto',
            )}
            onClick={() => onOpen(index)}
            aria-label={isMoreTrigger ? undefined : localize(item.title, locale)}
          >
            {item.image.type === 'video' ? (
              <video
                className="h-full w-full object-cover"
                src={item.image.src}
                poster={item.image.poster}
                muted
                playsInline
                preload="none"
                aria-label={localize(item.alt, locale)}
              />
            ) : (
              <ResponsiveImage
                image={item.image}
                alt={isMoreTrigger ? '' : localize(item.alt, locale)}
                className="h-full"
                sizes={
                  index === 0
                    ? '(min-width: 1024px) 50vw, (min-width: 640px) 50vw, 50vw'
                    : '(min-width: 1024px) 25vw, 25vw'
                }
              />
            )}
            <span className="absolute inset-0 bg-gradient-to-t from-[rgba(15,23,42,0.66)] via-[rgba(15,23,42,0.16)] to-transparent opacity-90" />
            {!isMoreTrigger ? (
              <span className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-1.5 text-white sm:bottom-3 sm:left-3 sm:right-3 lg:bottom-4 lg:left-4 lg:right-4 lg:gap-3">
                <span className="min-w-0 overflow-hidden text-[0.68rem] font-semibold leading-tight [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] sm:text-sm lg:text-base">
                  {localize(item.title, locale)}
                </span>
                <span className="grid size-7 shrink-0 place-items-center rounded-xl bg-[rgba(214,181,138,0.22)] text-white backdrop-blur transition group-hover:bg-[rgba(214,181,138,0.34)] sm:size-8 lg:size-10">
                  {item.image.type === 'video' ? (
                    <Play aria-hidden="true" className="size-3 fill-current lg:size-4" />
                  ) : (
                    <Maximize2 aria-hidden="true" className="size-3 lg:size-4" />
                  )}
                </span>
              </span>
            ) : null}
            {isMoreTrigger ? (
              <span className="absolute inset-0 flex items-center justify-center bg-[rgba(15,23,42,0.58)] p-2 text-center backdrop-blur-[2px] transition group-hover:bg-[rgba(15,23,42,0.68)] sm:p-4">
                <span className="grid min-h-16 w-full max-w-[9rem] place-items-center rounded-[1.1rem] border border-[var(--color-border)] bg-[rgba(214,181,138,0.18)] px-2 py-2 text-white shadow-[var(--shadow-soft)] backdrop-blur-md sm:max-w-[11rem] sm:px-4 sm:py-3 lg:max-w-[13rem] lg:px-5 lg:py-4">
                  <span className="block text-[0.7rem] font-semibold leading-tight sm:text-sm lg:text-lg">
                    {t('gallery.viewMore')}
                  </span>
                  <span className="mt-1 block text-[0.62rem] leading-tight text-white/82 sm:text-xs lg:text-sm">
                    {t('gallery.moreCount', { count: hiddenItemsCount })}
                  </span>
                </span>
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
})

const GalleryArticle = memo(function GalleryArticle({
  section,
  sectionIndex,
  locale,
  onOpen,
}: {
  section: GallerySectionContent
  sectionIndex: number
  locale: Locale
  onOpen: (sectionIndex: number, itemIndex: number) => void
}) {
  const openItem = useCallback(
    (itemIndex: number) => onOpen(sectionIndex, itemIndex),
    [onOpen, sectionIndex],
  )

  return (
    <article className="grid gap-5">
      <div className="grid gap-2 md:grid-cols-[minmax(0,0.48fr)_1fr] md:items-end">
        <h3 className="text-2xl font-semibold text-[var(--color-ink)] sm:text-3xl">
          {localize(section.title, locale)}
        </h3>
        <p className="max-w-3xl text-sm leading-6 text-[var(--color-muted)] md:justify-self-end md:text-right">
          {localize(section.lead, locale)}
        </p>
      </div>
      {section.items.length > 0 ? (
        <GalleryMosaic items={section.items} locale={locale} onOpen={openItem} />
      ) : null}
    </article>
  )
})

export function GallerySection({ sections, locale }: { sections: GallerySectionContent[]; locale: Locale }) {
  const { t } = useTranslation()
  const [activeSectionIndex, setActiveSectionIndex] = useState<number | null>(null)
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null)
  const activeItems = activeSectionIndex === null ? [] : (sections[activeSectionIndex]?.items ?? [])
  const openItem = useCallback((sectionIndex: number, itemIndex: number) => {
    setActiveSectionIndex(sectionIndex)
    setActiveItemIndex(itemIndex)
  }, [])
  const closeLightbox = useCallback(() => {
    setActiveSectionIndex(null)
    setActiveItemIndex(null)
  }, [])

  return (
    <section id="gallery" className="section-spacing bg-[var(--color-deep)] px-4 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow={t('sections.galleryEyebrow')}
          title={t('sections.galleryTitle')}
          lead={t('sections.galleryLead')}
          align="center"
        />
        <div className="mt-10 grid gap-12 lg:gap-14">
          {sections.map((section, sectionIndex) => (
            <GalleryArticle
              key={section.id}
              section={section}
              sectionIndex={sectionIndex}
              locale={locale}
              onOpen={openItem}
            />
          ))}
        </div>
      </div>
      <Lightbox
        items={activeItems}
        locale={locale}
        activeIndex={activeItemIndex}
        onClose={closeLightbox}
        onChange={setActiveItemIndex}
      />
    </section>
  )
}
