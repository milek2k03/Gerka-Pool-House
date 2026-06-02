import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SectionHeading } from '../components/ui/SectionHeading'
import type { Locale } from '../types/common'
import type { FaqItem } from '../types/content'
import { cn } from '../utils/cn'
import { localize } from '../utils/locale'

export function FaqSection({ items, locale }: { items: FaqItem[]; locale: Locale }) {
  const { t } = useTranslation()
  const [openId, setOpenId] = useState(items[0]?.id)

  return (
    <section id="faq" className="bg-[var(--color-deep)] px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading eyebrow={t('sections.faqEyebrow')} title={t('sections.faqTitle')} />
        <div className="divide-y divide-[var(--color-border)] rounded-md border border-[var(--color-border)]">
          {items.map((item) => {
            const isOpen = item.id === openId
            return (
              <article key={item.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 p-5 text-left font-semibold text-[var(--color-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-water)]"
                  aria-expanded={isOpen}
                  onClick={() => setOpenId(isOpen ? '' : item.id)}
                >
                  <span>{localize(item.question, locale)}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn('size-5 shrink-0 transition', isOpen && 'rotate-180')}
                  />
                </button>
                <div className={cn('grid transition-all', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-6 text-[var(--color-muted)]">
                      {localize(item.answer, locale)}
                    </p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
