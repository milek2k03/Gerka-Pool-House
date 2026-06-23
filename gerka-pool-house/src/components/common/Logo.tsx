import type { MouseEvent } from 'react'
import { Link, useLocation } from 'react-router'

import logoMark from '../../assets/images/gerka-logo.png'
import { useSiteContent } from '../../hooks/useSiteContent'

export function Logo({ to = '/' }: { to?: string }) {
  const { content } = useSiteContent()
  const location = useLocation()

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname !== '/') return

    event.preventDefault()
    window.history.replaceState(null, '', '/')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Link
      to={to}
      onClick={handleClick}
      aria-label={content.brandName}
      className="inline-flex min-w-0 items-center rounded-[1.1rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brass)]"
    >
      <span className="grid h-14 w-[5.5rem] shrink-0 place-items-center p-1 sm:h-16 sm:w-[6.5rem] lg:h-[4.25rem] lg:w-28">
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
