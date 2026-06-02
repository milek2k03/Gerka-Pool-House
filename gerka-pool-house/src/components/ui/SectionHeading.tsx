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
    <div className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center')}>
      <p className={cn('mb-3 text-sm font-semibold uppercase tracking-[0.18em]', inverted ? 'text-[var(--color-brass)]' : 'text-[var(--color-clay)]')}>{eyebrow}</p>
      <h2 className={cn('text-3xl font-semibold leading-tight sm:text-4xl', inverted ? 'text-white' : 'text-[var(--color-ink)]')}>{title}</h2>
      {lead ? <p className={cn('mt-4 text-base leading-7 sm:text-lg', inverted ? 'text-white/70' : 'text-[var(--color-muted)]')}>{lead}</p> : null}
      {children}
    </div>
  )
}
