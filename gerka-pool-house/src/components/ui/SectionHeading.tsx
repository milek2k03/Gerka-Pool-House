import type { ReactNode } from 'react'

import { cn } from '../../utils/cn'

interface SectionHeadingProps {
  eyebrow: string
  title: string
  lead?: string
  align?: 'left' | 'center'
  tone?: 'light' | 'dark'
  children?: ReactNode
}

export function SectionHeading({ eyebrow, title, lead, align = 'left', tone = 'light', children }: SectionHeadingProps) {
  const inverted = tone === 'dark'

  return (
    <div className={cn('max-w-4xl', align === 'center' && 'mx-auto text-center')}>
      <p className={cn('mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-brass)]')}>{eyebrow}</p>
      <h2 className={cn('text-4xl font-semibold leading-[1.06] sm:text-5xl lg:text-[3.35rem]', inverted ? 'text-white' : 'text-[var(--color-ink)]')}>{title}</h2>
      {lead ? <p className={cn('mt-5 text-base leading-8 sm:text-lg', inverted ? 'text-white/76' : 'text-[var(--color-muted)]')}>{lead}</p> : null}
      {children}
    </div>
  )
}
