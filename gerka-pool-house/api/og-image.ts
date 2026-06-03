/// <reference types="node" />

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import sharp from 'sharp'

import { loadLocalEnv } from './_env.js'

loadLocalEnv()

interface ApiRequest {
  method?: string
}

interface ApiResponse {
  setHeader: (name: string, value: string) => void
  status: (statusCode: number) => ApiResponse
  end: (body?: Buffer | string) => void
  json: (body: unknown) => void
}

type SiteContentResponse = Array<{
  content?: {
    hero?: {
      image?: {
        src?: string
      }
    }
  }
}>

const width = 1200
const height = 630
const fallbackImagePath = resolve(process.cwd(), 'public', 'og-image-v3.jpg')
const logoPath = resolve(process.cwd(), 'public', 'social-logo.png')

function resolvePublicUrl(value?: string) {
  if (!value) return undefined
  if (value.startsWith('http://') || value.startsWith('https://')) return value

  const siteUrl = (process.env.VITE_SITE_URL ?? 'https://gerka-pool-house.vercel.app').replace(/\/$/, '')

  return `${siteUrl}${value.startsWith('/') ? value : `/${value}`}`
}

async function fetchBuffer(url: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 7000)

  try {
    const response = await fetch(url, { signal: controller.signal })

    if (!response.ok) {
      throw new Error(`Image request failed with status ${response.status}`)
    }

    return Buffer.from(await response.arrayBuffer())
  } finally {
    clearTimeout(timeout)
  }
}

async function loadSiteContent() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) return null

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/site_content?id=eq.main&select=content`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  })

  if (!response.ok) return null

  const data = (await response.json()) as SiteContentResponse

  return data[0]?.content ?? null
}

function createOverlaySvg() {
  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#090f0c" stop-opacity="0.46"/>
          <stop offset="0.52" stop-color="#090f0c" stop-opacity="0.18"/>
          <stop offset="1" stop-color="#090f0c" stop-opacity="0.18"/>
        </linearGradient>
        <linearGradient id="bottom" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="#090f0c" stop-opacity="0.36"/>
          <stop offset="0.55" stop-color="#090f0c" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#shade)"/>
      <rect width="${width}" height="${height}" fill="url(#bottom)"/>
      <rect x="70" y="70" width="180" height="128" rx="16" fill="#111f16" stroke="#d6b36f" stroke-opacity="0.48" stroke-width="1.5"/>
    </svg>
  `)
}

async function createOgImage() {
  const content = await loadSiteContent()
  const heroImageUrl = resolvePublicUrl(content?.hero?.image?.src)

  if (!heroImageUrl) {
    return readFile(fallbackImagePath)
  }

  const [backgroundImage, logoImage] = await Promise.all([fetchBuffer(heroImageUrl), readFile(logoPath)])
  const logo = await sharp(logoImage).resize({ width: 164, height: 112, fit: 'inside' }).png().toBuffer()
  const overlay = createOverlaySvg()

  return sharp(backgroundImage)
    .rotate()
    .resize(width, height, { fit: 'cover', position: 'center' })
    .composite([
      { input: overlay, left: 0, top: 0 },
      { input: logo, left: 88, top: 82 },
    ])
    .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
    .toBuffer()
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method && !['GET', 'HEAD'].includes(request.method)) {
    response.setHeader('Allow', 'GET, HEAD')
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  response.setHeader('Content-Type', 'image/jpeg')
  response.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=3600')

  if (request.method === 'HEAD') {
    response.status(200).end()
    return
  }

  try {
    response.status(200).end(await createOgImage())
  } catch {
    response.setHeader('X-OG-Image-Fallback', 'static')
    response.status(200).end(await readFile(fallbackImagePath))
  }
}
