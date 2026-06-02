import { Maximize2, Play } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Lightbox } from '../components/common/Lightbox'
import { ResponsiveImage } from '../components/common/ResponsiveImage'
import { SectionHeading } from '../components/ui/SectionHeading'
import type { Locale } from '../types/common'
import type { GalleryItem } from '../types/content'
import { cn } from '../utils/cn'
import { localize } from '../utils/locale'

export function GallerySection({ items, locale }: { items: GalleryItem[]; locale: Locale }) {
  const { t } = useTranslation()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const visibleItems = items.slice(0, 5)
  const hiddenItemsCount = Math.max(0, items.length - visibleItems.length)

  return (
    <section id="gallery" className="bg-[var(--color-deep)] px-4 py-16 sm:px-8 sm:py-20 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow={t('sections.galleryEyebrow')}
          title={t('sections.galleryTitle')}
          lead={t('sections.galleryLead')}
          align="center"
        />
        <div className="mt-8 grid grid-cols-4 gap-2 sm:gap-3 lg:mt-10 lg:gap-4">
          {visibleItems.map((item, index) => {
            const isMoreTrigger = hiddenItemsCount > 0 && index === visibleItems.length - 1

            return (
              <motion.button
                key={item.id}
                type="button"
                className={cn(
                  'group relative aspect-square overflow-hidden rounded-md bg-[var(--color-paper)] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-water)]',
                  index === 0 && 'col-span-2 row-span-2',
                  'lg:aspect-[4/5] lg:first:col-span-2 lg:first:row-span-2 lg:first:aspect-auto',
                )}
                onClick={() => setActiveIndex(index)}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ delay: index * 0.06 }}
                aria-label={
                  isMoreTrigger
                    ? `${t('gallery.viewMore')}. ${t('gallery.moreCount', { count: hiddenItemsCount })}`
                    : localize(item.title, locale)
                }
              >
                {item.image.type === 'video' ? (
                  <video
                    className="h-full w-full object-cover"
                    src={item.image.src}
                    poster={item.image.poster}
                    muted
                    playsInline
                    preload="metadata"
                    aria-label={localize(item.alt, locale)}
                  />
                ) : (
                  <ResponsiveImage
                    image={item.image}
                    alt={localize(item.alt, locale)}
                    className="h-full"
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 25vw, 50vw"
                  />
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-black/62 via-black/12 to-transparent opacity-90" />
                <span className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-1.5 text-white sm:bottom-3 sm:left-3 sm:right-3 lg:bottom-4 lg:left-4 lg:right-4 lg:gap-3">
                  <span className="min-w-0 overflow-hidden text-[0.68rem] font-semibold leading-tight [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] sm:text-sm lg:text-base">
                    {localize(item.title, locale)}
                  </span>
                  <span className="grid size-7 shrink-0 place-items-center rounded-md bg-white/18 backdrop-blur transition group-hover:bg-white/28 sm:size-8 lg:size-10">
                    {item.image.type === 'video' ? (
                      <Play aria-hidden="true" className="size-3 fill-current lg:size-4" />
                    ) : (
                      <Maximize2 aria-hidden="true" className="size-3 lg:size-4" />
                    )}
                  </span>
                </span>
                {isMoreTrigger ? (
                  <span className="absolute inset-0 grid place-items-center bg-black/48 px-2 text-center backdrop-blur-[2px] transition group-hover:bg-black/58 sm:px-4">
                    <span className="rounded-md border border-white/25 bg-white/16 px-3 py-2 text-white shadow-lg backdrop-blur-md sm:px-4 sm:py-3 lg:px-5 lg:py-4">
                      <span className="block text-xs font-semibold sm:text-sm lg:text-lg">{t('gallery.viewMore')}</span>
                      <span className="mt-1 block text-[0.68rem] leading-tight text-white/82 sm:text-xs lg:text-sm">
                        {t('gallery.moreCount', { count: hiddenItemsCount })}
                      </span>
                    </span>
                  </span>
                ) : null}
              </motion.button>
            )
          })}
        </div>
      </div>
      <Lightbox items={items} locale={locale} activeIndex={activeIndex} onClose={() => setActiveIndex(null)} onChange={setActiveIndex} />
    </section>
  )
}
