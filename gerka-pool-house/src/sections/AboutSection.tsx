import { useTranslation } from 'react-i18next'

import { FeatureIcon } from '../components/common/Icon'
import { SectionHeading } from '../components/ui/SectionHeading'
import type { Locale } from '../types/common'
import type { SiteContent } from '../types/content'
import { localize } from '../utils/locale'
import { isApartment2Enabled } from '../utils/pricing'

type RichPart =
  | {
      type: 'paragraphs'
      lines: string[]
    }
  | {
      type: 'list'
      items: string[]
    }

interface RichSectionContent {
  id: string
  heading: string
  parts: RichPart[]
}

function parseParts(block: string): RichPart[] {
  const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
  const parts: RichPart[] = []
  let paragraphs: string[] = []
  let listItems: string[] = []

  const flushParagraphs = () => {
    if (paragraphs.length > 0) {
      parts.push({ type: 'paragraphs', lines: paragraphs })
      paragraphs = []
    }
  }

  const flushList = () => {
    if (listItems.length > 0) {
      parts.push({ type: 'list', items: listItems })
      listItems = []
    }
  }

  for (const line of lines) {
    if (line.startsWith('* ')) {
      flushParagraphs()
      listItems.push(line.replace(/^\*\s+/, ''))
    } else {
      flushList()
      paragraphs.push(line)
    }
  }

  flushParagraphs()
  flushList()

  return parts
}

function parseRichSections(value: string): RichSectionContent[] {
  const blocks = value.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean)
  const sections: RichSectionContent[] = []
  let current: RichSectionContent | null = null

  for (const block of blocks) {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
    const heading = lines[0]?.startsWith('#### ') ? lines[0].replace(/^####\s+/, '') : ''

    if (heading) {
      if (current) sections.push(current)

      current = {
        id: block,
        heading,
        parts: parseParts(lines.slice(1).join('\n')),
      }
      continue
    }

    if (current) {
      current.parts.push(...parseParts(block))
    } else {
      sections.push({
        id: block,
        heading: '',
        parts: parseParts(block),
      })
    }
  }

  if (current) sections.push(current)

  return sections
}

function splitApartmentSection(section: RichSectionContent) {
  const firstListIndex = section.parts.findIndex((part) => part.type === 'list')

  if (firstListIndex === -1) {
    return { card: section, overflow: [] as RichPart[] }
  }

  return {
    card: {
      ...section,
      parts: section.parts.slice(0, firstListIndex + 1),
    },
    overflow: section.parts.slice(firstListIndex + 1),
  }
}

function RichParts({
  parts,
  compact = false,
  formatLine = (line) => line,
}: {
  parts: RichPart[]
  compact?: boolean
  formatLine?: (line: string) => string
}) {
  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {parts.map((part, index) =>
        part.type === 'paragraphs' ? (
          <div key={`paragraphs-${index}`} className="space-y-2">
            {part.lines.map((line) => (
              <p key={line} className={compact ? 'text-sm leading-6 text-[var(--color-muted)]' : 'text-base leading-8 text-[var(--color-muted)] sm:text-lg'}>
                {formatLine(line)}
              </p>
            ))}
          </div>
        ) : (
          <ul key={`list-${index}`} className="grid gap-2">
            {part.items.map((line) => (
              <li
                key={line}
                className={compact ? 'grid grid-cols-[auto_1fr] gap-3 text-sm leading-6 text-[var(--color-muted)]' : 'grid grid-cols-[auto_1fr] gap-3 text-base leading-7 text-[var(--color-muted)]'}
              >
                <span className="mt-2.5 size-1.5 rounded-full bg-[var(--color-brass)]" aria-hidden="true" />
                <span>{formatLine(line)}</span>
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  )
}

function ApartmentCard({ section }: { section: RichSectionContent }) {
  return (
    <article
      className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-1.5 hover:border-[var(--color-brass)] hover:shadow-[var(--shadow-premium)]"
    >
      <h3 className="text-xl font-semibold text-[var(--color-ink)]">{section.heading}</h3>
      <div className="mt-4">
        <RichParts parts={section.parts} compact />
      </div>
    </article>
  )
}

function ApartmentComingSoonCard({ title, message }: { title: string; message: string }) {
  const { t } = useTranslation()

  return (
    <article
      className="rounded-[var(--radius-card)] border border-dashed border-[rgba(214,181,138,0.36)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-1.5 hover:border-[var(--color-brass)] hover:shadow-[var(--shadow-premium)]"
    >
      <span className="inline-flex rounded-full border border-[var(--color-brass)] bg-[rgba(214,181,138,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-brass)]">
        {t('pricing.room2ComingSoon')}
      </span>
      <h3 className="mt-4 text-xl font-semibold text-[var(--color-ink)]">{title}</h3>
      <p className="mt-4 text-sm leading-6 text-[var(--color-muted)]">{message}</p>
    </article>
  )
}

export function AboutSection({ content, locale }: { content: SiteContent; locale: Locale }) {
  const { t } = useTranslation()
  const room2Enabled = isApartment2Enabled(content.pricing)
  const sections = parseRichSections(localize(content.about.body, locale))
  const headedSections = sections.filter((section) => section.heading)
  const apartment1Split = headedSections[0] ? splitApartmentSection(headedSections[0]) : null
  const apartment2Split = headedSections[1] ? splitApartmentSection(headedSections[1]) : null
  const apartment2Capacity = Math.max(1, content.pricing.maxGuests - content.pricing.room1Capacity)
  const fallbackApartment2Section: RichSectionContent = {
    id: 'apartment-2-fallback',
    heading: t('about.apartment2FallbackTitle'),
    parts: [
      {
        type: 'paragraphs',
        lines: [
          t('about.apartment2FallbackIntro', { count: apartment2Capacity }),
          t('about.apartment2FallbackOfferLabel'),
        ],
      },
      {
        type: 'list',
        items: [
          t('about.apartment2FallbackBedroom'),
          t('about.apartment2FallbackLivingRoom'),
          t('about.apartment2FallbackDiningRoom'),
          t('about.apartment2FallbackKitchen'),
          t('about.apartment2FallbackBathrooms'),
          t('about.apartment2FallbackBalcony'),
        ],
      },
    ],
  }
  const supportingParts = [
    ...sections.filter((section) => !section.heading).flatMap((section) => section.parts),
    ...(apartment1Split?.overflow ?? []),
    ...(room2Enabled ? apartment2Split?.overflow ?? [] : []),
    ...headedSections.slice(2).flatMap((section) => section.parts),
  ]

  return (
    <section id="about" className="section-spacing bg-[var(--color-paper)] px-5 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <SectionHeading
            eyebrow={t('sections.aboutEyebrow')}
            title={localize(content.about.title, locale)}
            lead={localize(content.about.lead, locale)}
          />
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {apartment1Split ? (
            <>
              <ApartmentCard section={apartment1Split.card} />
              {room2Enabled ? (
                <ApartmentCard section={apartment2Split?.card ?? fallbackApartment2Section} />
              ) : (
                <ApartmentComingSoonCard
                  title={t('about.apartment2FallbackTitle')}
                  message={t('pricing.room2DisabledNotice', { count: content.pricing.room1Capacity })}
                />
              )}
            </>
          ) : (
            <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)] lg:col-span-2">
              <RichParts parts={sections.flatMap((section) => section.parts)} />
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {supportingParts.length > 0 ? (
            <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-paper-2)] p-6 shadow-[var(--shadow-soft)]">
              <RichParts parts={supportingParts} />
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {content.about.highlights.map((item) => (
              <article
                key={item.id}
                className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-1.5 hover:border-[var(--color-brass)] hover:shadow-[var(--shadow-premium)]"
              >
                <div className="mb-4 grid size-10 place-items-center rounded-xl bg-[rgba(214,181,138,0.14)] text-[var(--color-brass)]">
                  <FeatureIcon icon={item.icon} />
                </div>
                <h3 className="text-base font-semibold text-[var(--color-ink)]">{localize(item.title, locale)}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                  {localize(item.description, locale)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
