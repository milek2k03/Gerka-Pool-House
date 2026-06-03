import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'

import { cn } from '../../utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const variants: Record<Variant, string> = {
  primary:
    'bg-[var(--color-brass)] text-[#111827] shadow-[0_14px_34px_rgba(214,181,138,0.22)] hover:bg-[var(--color-brass-hover)] focus-visible:ring-[var(--color-brass)]',
  secondary:
    'border border-[var(--color-brass)] bg-transparent text-[var(--color-ink)] shadow-[0_12px_30px_rgba(0,0,0,0.14)] hover:border-[var(--color-brass-hover)] hover:bg-[rgba(214,181,138,0.10)] focus-visible:ring-[var(--color-brass)]',
  ghost: 'text-[var(--color-ink)] hover:bg-white/8 focus-visible:ring-[var(--color-brass)]',
  danger:
    'border border-red-400/25 bg-red-950/45 text-red-200 hover:bg-red-900/55 focus-visible:ring-red-400',
}

const sizes: Record<Size, string> = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-base',
  icon: 'size-11 p-0',
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-medium transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-deep)] disabled:pointer-events-none disabled:opacity-55'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => (
    <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  ),
)

Button.displayName = 'Button'

interface ButtonLinkProps extends LinkProps {
  variant?: Variant
  size?: Size
}

export function ButtonLink({ className, variant = 'primary', size = 'md', children, ...props }: ButtonLinkProps) {
  return (
    <Link className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </Link>
  )
}

interface AnchorButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant
  size?: Size
}

export function AnchorButton({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: AnchorButtonProps) {
  return (
    <a className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </a>
  )
}
