/// <reference types="node" />

import { loadLocalEnv } from './_env.js'

loadLocalEnv()

interface ApiRequest {
  method?: string
  query?: {
    variant?: string | string[]
  }
}

interface ApiResponse {
  setHeader: (name: string, value: string) => void
  status: (statusCode: number) => ApiResponse
  end: (body?: string) => void
  json: (body: unknown) => void
}

interface HeroAsset {
  src?: string
}

interface SiteContentRow {
  content?: {
    hero?: {
      image?: HeroAsset
      mobileImage?: HeroAsset
    }
  }
}

const fallbackImage = '/og-image-v3.jpg'

function getVariant(request: ApiRequest) {
  const value = Array.isArray(request.query?.variant)
    ? request.query?.variant[0]
    : request.query?.variant

  return value === 'desktop' ? 'desktop' : 'mobile'
}

function getRenderedImageUrl(source: string, variant: 'mobile' | 'desktop') {
  if (!source.includes('/storage/v1/object/public/')) return source

  const url = new URL(source)
  url.pathname = url.pathname.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/',
  )
  url.searchParams.set('width', variant === 'mobile' ? '768' : '1600')
  url.searchParams.set('quality', '82')
  url.searchParams.set('resize', 'contain')
  url.searchParams.set('format', 'webp')

  return url.toString()
}

async function getCurrentHeroImage(variant: 'mobile' | 'desktop') {
  const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) return fallbackImage

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 4000)

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/site_content?id=eq.main&select=content`,
      {
        signal: controller.signal,
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          Accept: 'application/json',
        },
      },
    )

    if (!response.ok) return fallbackImage

    const rows = (await response.json()) as SiteContentRow[]
    const hero = rows[0]?.content?.hero
    const source =
      variant === 'mobile'
        ? hero?.mobileImage?.src ?? hero?.image?.src
        : hero?.image?.src

    return source ? getRenderedImageUrl(source, variant) : fallbackImage
  } catch {
    return fallbackImage
  } finally {
    clearTimeout(timeout)
  }
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method && !['GET', 'HEAD'].includes(request.method)) {
    response.setHeader('Allow', 'GET, HEAD')
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  const variant = getVariant(request)
  const location = await getCurrentHeroImage(variant)

  response.setHeader(
    'Cache-Control',
    'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
  )
  response.setHeader('Link', `<${location}>; rel=preload; as=image; fetchpriority=high`)
  response.setHeader('Location', location)
  response.status(307).end()
}
