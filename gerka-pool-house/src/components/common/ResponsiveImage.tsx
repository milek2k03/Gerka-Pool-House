import type { ImageAsset } from '../../types/content'
import { cn } from '../../utils/cn'

interface ResponsiveImageProps {
  image: ImageAsset
  mobileImage?: ImageAsset
  alt: string
  className?: string
  imgClassName?: string
  loading?: 'lazy' | 'eager'
  fetchPriority?: 'high' | 'low' | 'auto'
  sizes?: string
}

export function ResponsiveImage({
  image,
  mobileImage,
  alt,
  className,
  imgClassName,
  loading = 'lazy',
  fetchPriority = 'auto',
  sizes = '100vw',
}: ResponsiveImageProps) {
  return (
    <picture className={cn('block overflow-hidden', className)}>
      {mobileImage?.avif ? (
        <source media="(max-width: 639px)" srcSet={mobileImage.avif} type="image/avif" sizes={sizes} />
      ) : null}
      {mobileImage?.webp ? (
        <source media="(max-width: 639px)" srcSet={mobileImage.webp} type="image/webp" sizes={sizes} />
      ) : null}
      {mobileImage?.src ? <source media="(max-width: 639px)" srcSet={mobileImage.src} sizes={sizes} /> : null}
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
