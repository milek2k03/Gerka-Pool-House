import { Link } from 'react-router'

import logoMark from '../../../Logo (2).png'
import { useSiteContent } from '../../hooks/useSiteContent'

export function Logo({ to = '/' }: { to?: string }) {
  const { content } = useSiteContent()

  return (
    <Link
      to={to}
      aria-label={content.brandName}
      className="inline-flex min-w-0 items-center rounded-[1.1rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brass)]"
    >
      <span className="grid h-14 w-[5.5rem] shrink-0 place-items-center rounded-[1.1rem] border border-[var(--color-border)] bg-white/10 p-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.16)] backdrop-blur sm:h-16 sm:w-[6.5rem] lg:h-[4.25rem] lg:w-28">
        <img
          src={logoMark}
          alt=""
          className="h-[88%] w-[88%] -translate-y-0.5 object-contain sm:-translate-y-1"
          loading="eager"
          decoding="async"
        />
      </span>
    </Link>
  )
}
