import type { ImageAsset } from '../../types/content'
import { cn } from '../../utils/cn'
import { getSupabaseImageUrl } from '../../utils/imageUrl'

const responsiveWidths = [320, 480, 640, 960, 1200, 1600, 1920]
const mobileResponsiveWidths = [320, 480, 640, 768, 960]

const imageProfiles = {
  thumbnail: {
    widths: [240, 320, 480, 640, 768],
    quality: 78,
    fallbackWidth: 768,
  },
  gallery: {
    widths: [640],
    quality: 78,
    fallbackWidth: 640,
  },
  content: {
    widths: responsiveWidths,
    quality: 82,
    fallbackWidth: 1600,
  },
  fullscreen: {
    widths: [640, 960, 1200, 1600, 1920],
    quality: 84,
    fallbackWidth: 1920,
  },
} as const

type ImageProfile = keyof typeof imageProfiles

interface ResponsiveImageProps {
  image: ImageAsset
  mobileImage?: ImageAsset
  alt: string
  className?: string
  imgClassName?: string
  loading?: 'lazy' | 'eager'
  fetchPriority?: 'high' | 'low' | 'auto'
  sizes?: string
  profile?: ImageProfile
  hideOnError?: boolean
  onLoad?: () => void
}

function getSupabaseSrcSet(
  image: ImageAsset,
  format: 'origin' | 'webp' = 'webp',
  widths: readonly number[] = responsiveWidths,
  quality = 82,
) {
  if (image.type === 'video') return null

  const entries = widths
    .map((width) => {
      const url = getSupabaseImageUrl(image.src, width, format, quality)
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
  profile = 'content',
  hideOnError = false,
  onLoad,
}: ResponsiveImageProps) {
  const profileSettings = imageProfiles[profile]
  const mobileWidths =
    profile === 'thumbnail'
      ? profileSettings.widths
      : mobileResponsiveWidths
  const mobileSupabaseSrcSet = mobileImage
    ? getSupabaseSrcSet(mobileImage, 'webp', mobileWidths, profileSettings.quality)
    : null
  const supabaseSrcSet = getSupabaseSrcSet(
    image,
    'webp',
    profileSettings.widths,
    profileSettings.quality,
  )
  const mobileOptimizedFallbackSrc = mobileImage
    ? (getSupabaseImageUrl(
        mobileImage.src,
        Math.min(768, profileSettings.fallbackWidth),
        'origin',
        profileSettings.quality,
      ) ?? mobileImage.src)
    : null
  const optimizedFallbackSrc =
    getSupabaseImageUrl(
      image.src,
      profileSettings.fallbackWidth,
      'origin',
      profileSettings.quality,
    ) ?? image.src

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
        className={cn('h-full w-full', imgClassName ?? 'object-cover')}
        loading={loading}
        decoding={loading === 'eager' ? 'sync' : 'async'}
        fetchPriority={fetchPriority}
        onLoad={onLoad}
        onError={
          hideOnError
            ? (event) => {
                event.currentTarget.style.display = 'none'
              }
            : undefined
        }
      />
    </picture>
  )
}
