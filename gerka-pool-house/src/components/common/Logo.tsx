import { Link } from 'react-router'

import logoMark from '../../assets/brand/logo-mark-light.webp'
import { useSiteContent } from '../../hooks/useSiteContent'

export function Logo({ to = '/' }: { to?: string }) {
  const { content } = useSiteContent()

  return (
    <Link
      to={to}
      className="inline-flex min-w-0 items-center gap-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-water)] sm:gap-3"
    >
      <span className="grid h-10 w-14 shrink-0 place-items-center rounded-md border border-white/25 bg-white/10 p-1.5 backdrop-blur sm:h-11 sm:w-16">
        <img src={logoMark} alt="" className="h-full w-full object-contain" loading="eager" decoding="async" />
      </span>
      <span className="min-w-0 max-w-[10rem] truncate text-xs font-semibold uppercase tracking-[0.12em] sm:max-w-none sm:text-sm">
        {content.brandName}
      </span>
    </Link>
  )
}
