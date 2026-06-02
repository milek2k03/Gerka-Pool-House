import type { ImageAsset } from '../../types/content'
import { cn } from '../../utils/cn'

interface ResponsiveImageProps {
  image: ImageAsset
  alt: string
  className?: string
  imgClassName?: string
  loading?: 'lazy' | 'eager'
  fetchPriority?: 'high' | 'low' | 'auto'
  sizes?: string
}

export function ResponsiveImage({
  image,
  alt,
  className,
  imgClassName,
  loading = 'lazy',
  fetchPriority = 'auto',
  sizes = '100vw',
}: ResponsiveImageProps) {
  return (
    <picture className={cn('block overflow-hidden', className)}>
      {image.avif ? <source srcSet={image.avif} type="image/avif" sizes={sizes} /> : null}
      {image.webp ? <source srcSet={image.webp} type="image/webp" sizes={sizes} /> : null}
      <img
        src={image.src}
        alt={alt}
        className={cn('h-full w-full object-cover', imgClassName)}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
      />
    </picture>
  )
}
