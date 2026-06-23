import type { ImageAsset } from '../../types/content'
import { cn } from '../../utils/cn'

const supabasePublicObjectPath = '/storage/v1/object/public/'
const supabaseImageRenderPath = '/storage/v1/render/image/public/'
const responsiveWidths = [320, 480, 640, 768, 960, 1200, 1600, 1920]
const mobileResponsiveWidths = [320, 480, 640, 768, 960]

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

function getSupabaseImageUrl(src: string, width: number, format: 'origin' | 'webp' = 'webp') {
  if (!src.includes(supabasePublicObjectPath)) return null

  try {
    const url = new URL(src)

    url.pathname = url.pathname.replace(supabasePublicObjectPath, supabaseImageRenderPath)
    url.searchParams.set('width', String(width))
    url.searchParams.set('quality', '68')
    url.searchParams.set('resize', 'contain')
    url.searchParams.set('format', format)

    return url.toString()
  } catch {
    return null
  }
}

function getSupabaseSrcSet(
  image: ImageAsset,
  format: 'origin' | 'webp' = 'webp',
  widths = responsiveWidths,
) {
  if (image.type === 'video') return null

  const entries = widths
    .map((width) => {
      const url = getSupabaseImageUrl(image.src, width, format)
      return url ? `${url} ${width}w` : null
    })
    .filter(Boolean)

  return entries.length > 0 ? entries.join(', ') : null
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
  const mobileSupabaseSrcSet = mobileImage ? getSupabaseSrcSet(mobileImage, 'webp', mobileResponsiveWidths) : null
  const supabaseSrcSet = getSupabaseSrcSet(image)
  const mobileOptimizedFallbackSrc = mobileImage
    ? (getSupabaseImageUrl(mobileImage.src, 768, 'origin') ?? mobileImage.src)
    : null
  const optimizedFallbackSrc = getSupabaseImageUrl(image.src, 1600, 'origin') ?? image.src

  return (
    <picture className={cn('block overflow-hidden', className)}>
      {mobileSupabaseSrcSet ? (
        <source media="(max-width: 639px)" srcSet={mobileSupabaseSrcSet} type="image/webp" sizes={sizes} />
      ) : null}
      {mobileImage?.avif ? (
        <source media="(max-width: 639px)" srcSet={mobileImage.avif} type="image/avif" sizes={sizes} />
      ) : null}
      {mobileImage?.webp ? (
        <source media="(max-width: 639px)" srcSet={mobileImage.webp} type="image/webp" sizes={sizes} />
      ) : null}
      {mobileOptimizedFallbackSrc ? (
        <source media="(max-width: 639px)" srcSet={mobileOptimizedFallbackSrc} sizes={sizes} />
      ) : null}
      {supabaseSrcSet ? <source srcSet={supabaseSrcSet} type="image/webp" sizes={sizes} /> : null}
      {image.avif ? <source srcSet={image.avif} type="image/avif" sizes={sizes} /> : null}
      {image.webp ? <source srcSet={image.webp} type="image/webp" sizes={sizes} /> : null}
      <img
        src={optimizedFallbackSrc}
        alt={alt}
        className={cn('h-full w-full object-cover', imgClassName)}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
      />
    </picture>
  )
}
