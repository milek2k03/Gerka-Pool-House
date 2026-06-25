const supabasePublicObjectPath = '/storage/v1/object/public/'
const supabaseImageRenderPath = '/storage/v1/render/image/public/'

export function getSupabaseImageUrl(
  src: string,
  width: number,
  format: 'origin' | 'webp' = 'webp',
  quality = 82,
) {
  if (!src.includes(supabasePublicObjectPath)) return null

  try {
    const url = new URL(src)

    url.pathname = url.pathname.replace(supabasePublicObjectPath, supabaseImageRenderPath)
    url.searchParams.set('width', String(width))
    url.searchParams.set('quality', String(quality))
    url.searchParams.set('resize', 'contain')
    url.searchParams.set('format', format)

    return url.toString()
  } catch {
    return null
  }
}
