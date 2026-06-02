import { defaultSiteContent } from '../constants/defaultContent'
import type { ImageAsset, SiteContent } from '../types/content'
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient'

const tableName = 'site_content'
const contentId = 'main'
const storageKey = 'gerka-pool-house:site-content:v1'

function cloneContent(content: SiteContent): SiteContent {
  return structuredClone(content)
}

function fileStem(value?: string) {
  if (!value) return ''

  const fileName = value.replace(/\\/g, '/').split(/[?#]/)[0].split('/').pop() ?? ''

  return fileName.replace(/\.(avif|webp|png|jpe?g|gif|mp4|webm|mov)$/i, '').toLowerCase()
}

function isLegacyBundledAsset(value?: string) {
  if (!value) return false

  const normalized = value.replace(/\\/g, '/')

  return normalized.startsWith('/src/assets/') || normalized.startsWith('src/assets/')
}

const defaultGalleryImagesById = new Map(
  defaultSiteContent.gallery.map((item) => [item.id, item.image] as const),
)

const defaultImagesByStem = new Map<string, ImageAsset>(
  [
    defaultSiteContent.hero.image,
    defaultSiteContent.area.image,
    ...defaultSiteContent.gallery.map((item) => item.image),
  ].flatMap((image) =>
    [image.src, image.webp, image.avif, image.poster]
      .map(fileStem)
      .filter(Boolean)
      .map((stem) => [stem, image] as const),
  ),
)

function findDefaultImageForAsset(asset: ImageAsset, fallback?: ImageAsset) {
  const legacyStem = [asset.src, asset.webp, asset.avif, asset.poster].map(fileStem).find(Boolean)

  return (legacyStem ? defaultImagesByStem.get(legacyStem) : undefined) ?? fallback
}

function repairImageAsset(asset: ImageAsset, fallback?: ImageAsset): ImageAsset {
  if (asset.type === 'video' || asset.storagePath) return asset

  const hasLegacyPath = [asset.src, asset.webp, asset.avif, asset.poster].some(isLegacyBundledAsset)

  if (!hasLegacyPath) return asset

  const defaultImage = findDefaultImageForAsset(asset, fallback)

  if (!defaultImage) return asset

  return {
    ...defaultImage,
    type: asset.type ?? defaultImage.type,
  }
}

function repairBundledAssetPaths(content: SiteContent) {
  content.hero.image = repairImageAsset(content.hero.image, defaultSiteContent.hero.image)
  content.area.image = repairImageAsset(content.area.image, defaultSiteContent.area.image)

  content.gallery = content.gallery.map((item) => ({
    ...item,
    image: repairImageAsset(item.image, defaultGalleryImagesById.get(item.id)),
  }))

  for (const [pageKey, pageSettings] of Object.entries(content.seo)) {
    if (isLegacyBundledAsset(pageSettings.ogImage)) {
      content.seo[pageKey as keyof SiteContent['seo']] = {
        ...pageSettings,
        ogImage: defaultSiteContent.seo[pageKey as keyof SiteContent['seo']].ogImage,
      }
    }
  }

  return content
}

function mergeDeep<T>(base: T, override: unknown): T {
  if (Array.isArray(base)) {
    return (Array.isArray(override) ? override : base) as T
  }

  if (base && typeof base === 'object') {
    const source = base as Record<string, unknown>
    const incoming = override && typeof override === 'object' ? (override as Record<string, unknown>) : {}

    return Object.fromEntries(
      Object.entries(source).map(([key, value]) => [key, mergeDeep(value, incoming[key])]),
    ) as T
  }

  return (override ?? base) as T
}

function migrateContent(content: SiteContent, storedVersion: number): SiteContent {
  const replaceDefaultText = (current: string, previousDefault: string, nextDefault: string) =>
    current === previousDefault ? nextDefault : current

  if (storedVersion < 2) {
    content.version = defaultSiteContent.version
    content.contact.address = defaultSiteContent.contact.address
    content.contact.mapEmbedUrl = defaultSiteContent.contact.mapEmbedUrl
  }

  if (storedVersion < 3) {
    content.version = defaultSiteContent.version
    content.availability = (content.availability ?? []).filter(
      (range) => range.id !== 'sample-booked' && range.id !== 'sample-unavailable',
    )
  }

  if (storedVersion < 4) {
    content.version = defaultSiteContent.version
    content.pricing.minStayNights = 1
  }

  if (storedVersion < 5) {
    content.version = defaultSiteContent.version

    if (content.contact.phone === '+48 600 000 000') {
      content.contact.phone = defaultSiteContent.contact.phone
    }

    if (content.contact.email === 'kontakt@gerkapoolhouse.pl') {
      content.contact.email = defaultSiteContent.contact.email
    }

    if (content.contact.facebookUrl === 'https://www.facebook.com/') {
      content.contact.facebookUrl = defaultSiteContent.contact.facebookUrl
    }

    if (content.contact.instagramUrl === 'https://www.instagram.com/') {
      content.contact.instagramUrl = defaultSiteContent.contact.instagramUrl
    }

    content.hero.lead.pl = replaceDefaultText(
      content.hero.lead.pl,
      'Komfortowy obiekt do 12 osób, ogród, grill, parking i szybkie WiFi w miejscu stworzonym do długich weekendów i wakacyjnych spotkań.',
      defaultSiteContent.hero.lead.pl,
    )
    content.hero.lead.en = replaceDefaultText(
      content.hero.lead.en,
      'A comfortable stay for up to 12 guests with a garden, barbecue, parking and fast WiFi, designed for long weekends and summer gatherings.',
      defaultSiteContent.hero.lead.en,
    )
    content.about.lead.pl = replaceDefaultText(
      content.about.lead.pl,
      'Gerka Pool House łączy swobodę prywatnego domu, wygodę obiektu wakacyjnego i atmosferę premium bez nadmiaru formalności.',
      defaultSiteContent.about.lead.pl,
    )
    content.about.lead.en = replaceDefaultText(
      content.about.lead.en,
      'Gerka Pool House combines the freedom of a private home, the comfort of a holiday property and a premium atmosphere without unnecessary formality.',
      defaultSiteContent.about.lead.en,
    )
    content.about.body.pl = replaceDefaultText(
      content.about.body.pl,
      'Do dyspozycji gości są dwa pokoje, przestrzeń dzienna, ogród, basen, miejsce do grillowania i spokojna strefa relaksu. Układ obiektu sprawdza się zarówno dla rodzin z dziećmi, jak i grup przyjaciół, które chcą spędzić czas razem, ale z zachowaniem wygody i prywatności.',
      defaultSiteContent.about.body.pl,
    )
    content.about.body.en = replaceDefaultText(
      content.about.body.en,
      'Guests can enjoy two rooms, a living area, garden, swimming pool, barbecue zone and a quiet relaxation area. The layout works well for families with children and groups of friends who want to spend time together while keeping comfort and privacy.',
      defaultSiteContent.about.body.en,
    )
    content.area.lead.pl = replaceDefaultText(
      content.area.lead.pl,
      'W pobliżu znajdziesz miejsca na spacer, rodzinny obiad, aktywny dzień nad wodą i krótkie wycieczki bez pośpiechu.',
      defaultSiteContent.area.lead.pl,
    )
    content.area.lead.en = replaceDefaultText(
      content.area.lead.en,
      'Nearby you will find walking spots, family restaurants, active days by the water and unhurried short trips.',
      defaultSiteContent.area.lead.en,
    )
  }

  return repairBundledAssetPaths(content)
}

export const contentRepository = {
  loadLocal(): SiteContent {
    if (typeof window === 'undefined') return cloneContent(defaultSiteContent)

    const stored = window.localStorage.getItem(storageKey)
    if (!stored) return cloneContent(defaultSiteContent)

    try {
      const parsed = JSON.parse(stored) as Partial<SiteContent>
      const storedVersion = typeof parsed.version === 'number' ? parsed.version : 0
      const migrated = migrateContent(mergeDeep(cloneContent(defaultSiteContent), parsed), storedVersion)

      if (storedVersion < defaultSiteContent.version) {
        window.localStorage.setItem(storageKey, JSON.stringify(migrated))
      }

      return migrated
    } catch {
      return cloneContent(defaultSiteContent)
    }
  },

  async load(): Promise<SiteContent> {
    const supabase = await getSupabaseClient()

    if (supabase) {
      const { data, error } = await supabase.from(tableName).select('content').eq('id', contentId).maybeSingle()

      if (!error && data?.content) {
        const parsed = data.content as Partial<SiteContent>
        const storedVersion = typeof parsed.version === 'number' ? parsed.version : 0
        const next = migrateContent(mergeDeep(cloneContent(defaultSiteContent), parsed), storedVersion)

        this.saveLocal(next)
        return next
      }
    }

    return this.loadLocal()
  },

  saveLocal(content: SiteContent) {
    const next = { ...content, updatedAt: new Date().toISOString() }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, JSON.stringify(next))
    }

    return next
  },

  async save(content: SiteContent) {
    const next = { ...content, updatedAt: new Date().toISOString() }
    const supabase = await getSupabaseClient()

    if (supabase) {
      const { error } = await supabase
        .from(tableName)
        .upsert({ id: contentId, content: next, updated_at: next.updatedAt }, { onConflict: 'id' })

      if (error) throw error
    }

    return this.saveLocal(next)
  },

  async reset() {
    const next = cloneContent(defaultSiteContent)

    return this.save(next)
  },

  subscribe(onChange: () => void | Promise<void>) {
    if (!isSupabaseConfigured) return () => undefined

    let active = true
    let cleanup: (() => void) | null = null

    const notify = () => {
      void onChange()
    }

    void getSupabaseClient().then((supabaseClient) => {
      if (!active || !supabaseClient) return

      const channel = supabaseClient
        .channel('site-content-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: tableName, filter: `id=eq.${contentId}` }, notify)
        .subscribe()

      cleanup = () => {
        void supabaseClient.removeChannel(channel)
      }
    })

    return () => {
      active = false
      cleanup?.()
    }
  },
}
