import { defaultSiteContent } from '../constants/defaultContent'
import type { ImageAsset, SiteContent } from '../types/content'
import { removeExpiredManualAvailabilityRanges } from '../utils/availability'
import {
  getSupabaseClient,
  hasSupabaseAuthSession,
  isSupabaseConfigured,
} from './supabaseClient'

const tableName = 'site_content'
const contentId = 'main'
const storageKey = 'gerka-pool-house:site-content:v1'
const contentChangedEvent = 'gerka:site-content:changed'
const contentChannelName = 'gerka-site-content'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const previousHeroImageMarkers = [
  '69c00dcb-7289-4e5a-acb3-df5d32d1d9d6-img_3176.webp',
  'f1c76e49-6bde-4c48-80bf-0dc02971ec96-img_3176-1-.webp',
  'gerka-hero',
]
let bootstrapContentConsumed = false

function cloneContent(content: SiteContent): SiteContent {
  return structuredClone(content)
}

async function loadPublicContent(): Promise<Partial<SiteContent> | null> {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) return null

  if (
    !bootstrapContentConsumed &&
    typeof window !== 'undefined' &&
    window.__GERKA_SITE_CONTENT_PROMISE__
  ) {
    bootstrapContentConsumed = true
    const content = await window.__GERKA_SITE_CONTENT_PROMISE__

    return content && typeof content === 'object' ? (content as Partial<SiteContent>) : null
  }

  const controller = new AbortController()
  const timeout = globalThis.setTimeout(() => controller.abort(), 6000)

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/${tableName}?id=eq.${contentId}&select=content`,
      {
        signal: controller.signal,
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          Accept: 'application/json',
        },
      },
    )

    if (!response.ok) return null

    const rows = (await response.json()) as Array<{ content?: Partial<SiteContent> }>

    return rows[0]?.content ?? null
  } catch {
    return null
  } finally {
    globalThis.clearTimeout(timeout)
  }
}

function removeExpiredAvailability(content: SiteContent) {
  content.availability = removeExpiredManualAvailabilityRanges(content.availability ?? [])

  return content
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

function isPreviousHeroImage(value?: string) {
  return Boolean(value && previousHeroImageMarkers.some((marker) => value.includes(marker)))
}

const defaultGalleryImagesById = new Map(
  [
    ...defaultSiteContent.gallery,
    ...defaultSiteContent.gallerySections.flatMap((section) => section.items),
  ].map((item) => [item.id, item.image] as const),
)

const defaultImagesByStem = new Map<string, ImageAsset>(
  [
    defaultSiteContent.hero.image,
    defaultSiteContent.hero.mobileImage,
    defaultSiteContent.area.image,
    ...defaultSiteContent.gallery.map((item) => item.image),
    ...defaultSiteContent.gallerySections.flatMap((section) => section.items.map((item) => item.image)),
  ].filter((image): image is ImageAsset => Boolean(image)).flatMap((image) =>
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
  const normalizedAsset = removeFallbackVariantsFromCustomAsset(asset, fallback)

  if (normalizedAsset.type === 'video' || normalizedAsset.storagePath) return normalizedAsset

  const hasLegacyPath = [normalizedAsset.src, normalizedAsset.webp, normalizedAsset.avif, normalizedAsset.poster].some(
    isLegacyBundledAsset,
  )

  if (!hasLegacyPath) return normalizedAsset

  const defaultImage = findDefaultImageForAsset(normalizedAsset, fallback)

  if (!defaultImage) return normalizedAsset

  return {
    ...defaultImage,
    type: normalizedAsset.type ?? defaultImage.type,
  }
}

function removeFallbackVariantsFromCustomAsset(asset: ImageAsset, fallback?: ImageAsset): ImageAsset {
  if (!fallback || !asset.src || asset.src === fallback.src) return asset

  const next = { ...asset }

  if (next.avif === fallback.avif) delete next.avif
  if (next.webp === fallback.webp) delete next.webp
  if (next.poster === fallback.poster) delete next.poster

  return next
}

function repairBundledAssetPaths(content: SiteContent) {
  content.hero.image = repairImageAsset(content.hero.image, defaultSiteContent.hero.image)
  content.hero.mobileImage = repairImageAsset(
    content.hero.mobileImage ?? content.hero.image,
    defaultSiteContent.hero.mobileImage ?? defaultSiteContent.hero.image,
  )
  content.area.image = repairImageAsset(content.area.image, defaultSiteContent.area.image)

  content.gallery = content.gallery.map((item) => ({
    ...item,
    image: repairImageAsset(item.image, defaultGalleryImagesById.get(item.id)),
  }))

  content.gallerySections = content.gallerySections.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      image: repairImageAsset(item.image, defaultGalleryImagesById.get(item.id)),
    })),
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

    const merged = Object.fromEntries(
      Object.entries(source).map(([key, value]) => [key, mergeDeep(value, incoming[key])]),
    ) as Record<string, unknown>

    for (const [key, value] of Object.entries(incoming)) {
      if (!(key in source)) {
        merged[key] = value
      }
    }

    return merged as T
  }

  return (override ?? base) as T
}

function replacePolishAccommodationTerms(value: string) {
  return value
    .replaceAll('Pokój 1', 'Apartament 1')
    .replaceAll('Pokój 2', 'Apartament 2')
    .replaceAll('Pokoje', 'Apartamenty')
    .replaceAll('Pokojów', 'Apartamentów')
    .replaceAll('Pokój', 'Apartament')
    .replaceAll('pokoju podstawowego', 'apartamentu podstawowego')
    .replaceAll('pokoju dla gości', 'apartamentu dla gości')
    .replaceAll('pokój dodatkowy', 'apartament dodatkowy')
    .replaceAll('pokój podstawowy', 'apartament podstawowy')
    .replaceAll('dwa pokoje', 'dwa apartamenty')
    .replaceAll('pokoje', 'apartamenty')
    .replaceAll('pokojów', 'apartamentów')
    .replaceAll('pokoi', 'apartamentów')
    .replaceAll('pokoju', 'apartamentu')
    .replaceAll('pokojach', 'apartamentach')
    .replaceAll('pokojami', 'apartamentami')
    .replaceAll('pokój', 'apartament')
}

function replaceEnglishAccommodationTerms(value: string) {
  return value
    .replaceAll('Room 1', 'Apartment 1')
    .replaceAll('Room 2', 'Apartment 2')
    .replaceAll('Rooms used', 'Apartments used')
    .replaceAll('two rooms', 'two apartments')
    .replaceAll('base room price', 'base apartment price')
    .replaceAll('base room', 'base apartment')
    .replaceAll('second room', 'second apartment')
    .replaceAll('additional room', 'additional apartment')
    .replaceAll('guest room', 'guest apartment')
    .replace(/\brooms\b/g, 'apartments')
    .replace(/\bRooms\b/g, 'Apartments')
    .replace(/\broom\b/g, 'apartment')
    .replace(/\bRoom\b/g, 'Apartment')
}

function replaceAccommodationTerms(content: SiteContent) {
  const replaceLocalized = (value: { pl: string; en: string }) => {
    value.pl = replacePolishAccommodationTerms(value.pl)
    value.en = replaceEnglishAccommodationTerms(value.en)
  }

  replaceLocalized(content.hero.eyebrow)
  replaceLocalized(content.hero.slogan)
  replaceLocalized(content.hero.lead)
  replaceLocalized(content.about.title)
  replaceLocalized(content.about.lead)
  replaceLocalized(content.about.body)

  content.about.highlights.forEach((item) => {
    replaceLocalized(item.title)
    replaceLocalized(item.description)
  })

  content.gallery.forEach((item) => {
    replaceLocalized(item.title)
    replaceLocalized(item.alt)
  })

  content.gallerySections.forEach((section) => {
    replaceLocalized(section.title)
    replaceLocalized(section.lead)
    section.items.forEach((item) => {
      replaceLocalized(item.title)
      replaceLocalized(item.alt)
    })
  })

  content.amenities.forEach((item) => {
    replaceLocalized(item.title)
    replaceLocalized(item.description)
  })

  replaceLocalized(content.area.title)
  replaceLocalized(content.area.lead)
  content.area.items.forEach((item) => {
    replaceLocalized(item.title)
    replaceLocalized(item.description)
    replaceLocalized(item.distance)
  })
  content.area.restaurants.forEach((item) => {
    replaceLocalized(item.title)
    replaceLocalized(item.description)
    replaceLocalized(item.distance)
    item.details?.forEach(replaceLocalized)
  })
  content.area.nearby.forEach((item) => {
    replaceLocalized(item.title)
    replaceLocalized(item.description)
    replaceLocalized(item.distance)
    item.details?.forEach(replaceLocalized)
  })
  content.area.busRoutes.forEach((item) => {
    replaceLocalized(item.title)
    replaceLocalized(item.description)
    replaceLocalized(item.distance)
    item.details?.forEach(replaceLocalized)
    if (item.link) {
      replaceLocalized(item.link.label)
    }
  })
  content.area.airports.forEach((item) => {
    replaceLocalized(item.title)
    replaceLocalized(item.description)
    replaceLocalized(item.distance)
    item.details?.forEach(replaceLocalized)
  })
  replaceLocalized(content.area.bikeRoutes.title)
  replaceLocalized(content.area.bikeRoutes.lead)
  content.area.bikeRoutes.routes.forEach(replaceLocalized)

  replaceLocalized(content.pricing.extraInfo)

  content.faq.forEach((item) => {
    replaceLocalized(item.question)
    replaceLocalized(item.answer)
  })

  replaceLocalized(content.booking.title)
  replaceLocalized(content.booking.lead)
  replaceLocalized(content.booking.confirmationSubject)
  replaceLocalized(content.booking.confirmationBody)

  for (const pageSettings of Object.values(content.seo)) {
    replaceLocalized(pageSettings.title)
    replaceLocalized(pageSettings.description)
  }
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

  if (storedVersion < 6) {
    content.version = defaultSiteContent.version
    content.pricing.discounts = content.pricing.discounts ?? []
  }

  if (storedVersion < 7) {
    content.version = defaultSiteContent.version
    replaceAccommodationTerms(content)
  }

  if (storedVersion < 8) {
    content.version = defaultSiteContent.version
    content.pricing.room2Enabled = content.pricing.room2Enabled ?? true
  }

  if (storedVersion < 9) {
    content.version = defaultSiteContent.version
    content.about = cloneContent(defaultSiteContent).about
    content.gallerySections = cloneContent(defaultSiteContent).gallerySections
    content.area.items = cloneContent(defaultSiteContent).area.items
    content.area.restaurants = cloneContent(defaultSiteContent).area.restaurants
    content.area.nearby = cloneContent(defaultSiteContent).area.nearby
    content.area.busRoutes = cloneContent(defaultSiteContent).area.busRoutes
    content.area.airports = cloneContent(defaultSiteContent).area.airports
    content.area.bikeRoutes = cloneContent(defaultSiteContent).area.bikeRoutes
    content.pricing.maxGuests = Math.max(content.pricing.maxGuests, defaultSiteContent.pricing.maxGuests)

    if (!content.faq.some((item) => item.id === 'pets')) {
      const petFaq = defaultSiteContent.faq.find((item) => item.id === 'pets')
      if (petFaq) content.faq.splice(1, 0, petFaq)
    }
  }

  if (storedVersion < 10) {
    content.version = defaultSiteContent.version

    const updateRestaurantDescription = (
      id: string,
      previous: { pl: string; en: string },
      next: { pl: string; en: string },
    ) => {
      const item = content.area.restaurants.find((restaurant) => restaurant.id === id)
      if (!item) return

      item.description.pl = replaceDefaultText(item.description.pl, previous.pl, next.pl)
      item.description.en = replaceDefaultText(item.description.en, previous.en, next.en)
    }

    updateRestaurantDescription(
      'bon-apetyt',
      {
        pl: 'Oferuje dostawę domowych obiadów, przekąsek oraz cateringu.',
        en: 'Offers delivery of homemade dinners, snacks and catering.',
      },
      defaultSiteContent.area.restaurants.find((item) => item.id === 'bon-apetyt')?.description ?? {
        pl: '',
        en: '',
      },
    )
    updateRestaurantDescription(
      'big-basza',
      {
        pl: 'Oferuje dostawę kebabów i pizzy.',
        en: 'Offers delivery of kebabs and pizza.',
      },
      defaultSiteContent.area.restaurants.find((item) => item.id === 'big-basza')?.description ?? {
        pl: '',
        en: '',
      },
    )
    updateRestaurantDescription(
      'restauracja-ostromecka',
      {
        pl: 'Serwuje tradycyjne polskie dania.',
        en: 'Serves traditional Polish dishes.',
      },
      defaultSiteContent.area.restaurants.find((item) => item.id === 'restauracja-ostromecka')?.description ?? {
        pl: '',
        en: '',
      },
    )
  }

  if (storedVersion < 11) {
    content.version = defaultSiteContent.version

    const updateNearbyItem = (
      id: string,
      previous: { pl: string; en: string },
      next: NonNullable<SiteContent['area']['nearby'][number]>,
    ) => {
      const item = content.area.nearby.find((nearbyItem) => nearbyItem.id === id)
      if (!item) return

      item.description.pl = replaceDefaultText(item.description.pl, previous.pl, next.description.pl)
      item.description.en = replaceDefaultText(item.description.en, previous.en, next.description.en)

      if (!item.details?.length) {
        item.details = next.details ? structuredClone(next.details) : undefined
      }
    }

    const stanMar = defaultSiteContent.area.nearby.find((item) => item.id === 'stan-mar')
    const dino = defaultSiteContent.area.nearby.find((item) => item.id === 'dino')

    if (stanMar) {
      updateNearbyItem(
        'stan-mar',
        {
          pl: 'Czynna 7 dni w tygodniu.',
          en: 'Open 7 days a week.',
        },
        stanMar,
      )
    }

    if (dino) {
      updateNearbyItem(
        'dino',
        {
          pl: 'Supermarket umożliwiający szybkie zakupy podczas pobytu.',
          en: 'A supermarket for quick shopping during your stay.',
        },
        dino,
      )
    }

    content.area.bikeRoutes.lead.pl = replaceDefaultText(
      content.area.bikeRoutes.lead.pl,
      'Przez Czarże przebiega Wiślana Trasa Rowerowa (WTR), będąca jednym z najdłuższych i najbardziej malowniczych szlaków rowerowych w Polsce. Trasa prowadzi przez tereny Doliny Dolnej Wisły i przebiega w pobliżu wałów przeciwpowodziowych.',
      defaultSiteContent.area.bikeRoutes.lead.pl,
    )
    content.area.bikeRoutes.lead.en = replaceDefaultText(
      content.area.bikeRoutes.lead.en,
      'The Vistula Cycling Route (WTR), one of the longest and most scenic cycling trails in Poland, runs through Czarze. The route crosses the Lower Vistula Valley and follows areas near the flood embankments.',
      defaultSiteContent.area.bikeRoutes.lead.en,
    )
  }

  if (storedVersion < 12) {
    content.version = defaultSiteContent.version

    const updateAreaItemDescription = (
      id: string,
      previous: { pl: string; en: string },
      next: { pl: string; en: string },
    ) => {
      const item = content.area.items.find((areaItem) => areaItem.id === id)
      if (!item) return

      item.description.pl = replaceDefaultText(item.description.pl, previous.pl, next.pl)
      item.description.en = replaceDefaultText(item.description.en, previous.en, next.en)
    }

    updateAreaItemDescription(
      'ostromecko-palace',
      {
        pl: 'Historyczny zespół pałacowo-parkowy z elegancką architekturą, zielenią i spokojnymi alejkami spacerowymi.',
        en: 'A historic palace and park complex with elegant architecture, greenery and peaceful walking alleys.',
      },
      defaultSiteContent.area.items.find((item) => item.id === 'ostromecko-palace')?.description ?? {
        pl: '',
        en: '',
      },
    )
    updateAreaItemDescription(
      'chelmno',
      {
        pl: 'Miasto zakochanych z zabytkową starówką, gotyckimi kościołami i klimatycznymi uliczkami nad Wisłą.',
        en: 'The city of lovers, known for its historic old town, Gothic churches and atmospheric streets near the Vistula River.',
      },
      defaultSiteContent.area.items.find((item) => item.id === 'chelmno')?.description ?? {
        pl: '',
        en: '',
      },
    )
    updateAreaItemDescription(
      'bydgoszcz',
      {
        pl: 'Miasto kanałów, Wyspy Młyńskiej, muzeów, spacerów nad Brdą i atrakcji dobrych na całodniową wycieczkę.',
        en: 'A city of canals, Mill Island, museums, riverside walks and attractions ideal for a day trip.',
      },
      defaultSiteContent.area.items.find((item) => item.id === 'bydgoszcz')?.description ?? {
        pl: '',
        en: '',
      },
    )
  }

  if (storedVersion < 13) {
    content.version = defaultSiteContent.version
    content.hero.mobileImage = content.hero.image
  }

  if (storedVersion < 15) {
    content.version = defaultSiteContent.version

    for (const [pageKey, pageSettings] of Object.entries(content.seo)) {
      const ogImage = pageSettings.ogImage ?? ''
      const ogImageStem = fileStem(ogImage)
      const isPreviousDefaultPreview =
        !ogImage ||
        ogImageStem === 'og-image' ||
        ogImageStem === 'og-image-v2' ||
        ogImageStem.includes('gerka-hero')

      if (isPreviousDefaultPreview) {
        content.seo[pageKey as keyof SiteContent['seo']] = {
          ...pageSettings,
          ogImage: defaultSiteContent.seo[pageKey as keyof SiteContent['seo']].ogImage,
        }
      }
    }
  }

  if (storedVersion < 16) {
    content.version = defaultSiteContent.version
    content.pricing.room2Enabled = false

    if (content.hero.lead.pl.includes('do 14 osób')) {
      content.hero.lead.pl = defaultSiteContent.hero.lead.pl
    }

    if (content.hero.lead.en.includes('up to 14 guests')) {
      content.hero.lead.en = defaultSiteContent.hero.lead.en
    }

    if (content.about.title.pl.includes('Dwa niezależne apartamenty')) {
      content.about.title.pl = defaultSiteContent.about.title.pl
    }

    if (content.about.title.en.includes('Two independent apartments')) {
      content.about.title.en = defaultSiteContent.about.title.en
    }

    if (content.about.lead.pl.includes('dwóch całkowicie niezależnych apartamentów')) {
      content.about.lead.pl = defaultSiteContent.about.lead.pl
    }

    if (content.about.lead.en.includes('two fully independent apartments')) {
      content.about.lead.en = defaultSiteContent.about.lead.en
    }

    if (content.about.body.pl.includes('Apartament na piętrze') || content.about.body.pl.includes('do 14 osób')) {
      content.about.body.pl = defaultSiteContent.about.body.pl
    }

    if (content.about.body.en.includes('First-floor apartment') || content.about.body.en.includes('up to 14 guests')) {
      content.about.body.en = defaultSiteContent.about.body.en
    }

    const familiesHighlight = content.about.highlights.find((item) => item.id === 'families-groups')
    const defaultFamiliesHighlight = defaultSiteContent.about.highlights.find((item) => item.id === 'families-groups')

    if (familiesHighlight && defaultFamiliesHighlight) {
      if (familiesHighlight.description.pl.includes('14 osób')) {
        familiesHighlight.description.pl = defaultFamiliesHighlight.description.pl
      }

      if (familiesHighlight.description.en.includes('14 guests')) {
        familiesHighlight.description.en = defaultFamiliesHighlight.description.en
      }
    }

    content.pricing.extraInfo.pl = replaceDefaultText(
      content.pricing.extraInfo.pl,
      'Cena jest szacunkowa i wymaga potwierdzenia przez właściciela po sprawdzeniu dostępności terminu.',
      defaultSiteContent.pricing.extraInfo.pl,
    )
    content.pricing.extraInfo.en = replaceDefaultText(
      content.pricing.extraInfo.en,
      'The price is estimated and requires confirmation by the owner after checking availability.',
      defaultSiteContent.pricing.extraInfo.en,
    )

    const capacityFaq = content.faq.find((item) => item.id === 'capacity')
    const defaultCapacityFaq = defaultSiteContent.faq.find((item) => item.id === 'capacity')

    if (capacityFaq && defaultCapacityFaq) {
      if (capacityFaq.answer.pl.includes('14 osób') || capacityFaq.answer.pl.includes('Apartament 2 aktywuje')) {
        capacityFaq.answer.pl = defaultCapacityFaq.answer.pl
      }

      if (capacityFaq.answer.en.includes('14 guests') || capacityFaq.answer.en.includes('Apartment 2 is automatically')) {
        capacityFaq.answer.en = defaultCapacityFaq.answer.en
      }
    }

    const pricingFaq = content.faq.find((item) => item.id === 'pricing')
    const defaultPricingFaq = defaultSiteContent.faq.find((item) => item.id === 'pricing')

    if (pricingFaq && defaultPricingFaq) {
      if (pricingFaq.answer.pl.includes('Powyżej 6 osób') || pricingFaq.answer.pl.includes('apartament dodatkowy')) {
        pricingFaq.answer.pl = defaultPricingFaq.answer.pl
      }

      if (pricingFaq.answer.en.includes('Above 6 guests') || pricingFaq.answer.en.includes('additional apartment')) {
        pricingFaq.answer.en = defaultPricingFaq.answer.en
      }
    }

    content.booking.lead.pl = replaceDefaultText(
      content.booking.lead.pl,
      'Wybierz daty, liczbę gości i zobacz szacunkową cenę przed wysłaniem wiadomości do właściciela.',
      defaultSiteContent.booking.lead.pl,
    )
    content.booking.lead.en = replaceDefaultText(
      content.booking.lead.en,
      'Choose dates and guest count to see an estimated price before sending your message to the owner.',
      defaultSiteContent.booking.lead.en,
    )

    if (content.seo.home.description.pl.includes('do 14 osób')) {
      content.seo.home.description.pl = defaultSiteContent.seo.home.description.pl
    }

    if (content.seo.home.description.en.includes('up to 14 guests')) {
      content.seo.home.description.en = defaultSiteContent.seo.home.description.en
    }
  }

  if (storedVersion < 17) {
    content.version = defaultSiteContent.version

    if (!content.area.airports?.length) {
      content.area.airports = cloneContent(defaultSiteContent).area.airports
    }
  }

  if (storedVersion < 18) {
    content.version = defaultSiteContent.version

    if (!content.area.busRoutes?.length) {
      content.area.busRoutes = cloneContent(defaultSiteContent).area.busRoutes
    }
  }

  if (storedVersion < 19) {
    content.version = defaultSiteContent.version

    const defaultBusRoutes = cloneContent(defaultSiteContent).area.busRoutes
    content.area.busRoutes = content.area.busRoutes ?? []

    defaultBusRoutes.forEach((defaultRoute) => {
      const existingIndex = content.area.busRoutes.findIndex((route) => route.id === defaultRoute.id)

      if (existingIndex === -1) {
        content.area.busRoutes.push(defaultRoute)
        return
      }

      if (defaultRoute.link && !content.area.busRoutes[existingIndex].link) {
        content.area.busRoutes[existingIndex].link = defaultRoute.link
      }
    })
  }

  if (storedVersion < 20) {
    content.version = defaultSiteContent.version

    const defaultBusRoutes = cloneContent(defaultSiteContent).area.busRoutes
    content.area.busRoutes = content.area.busRoutes ?? []

    defaultBusRoutes.forEach((defaultRoute) => {
      const existingIndex = content.area.busRoutes.findIndex((route) => route.id === defaultRoute.id)

      if (existingIndex === -1) {
        content.area.busRoutes.push(defaultRoute)
        return
      }

      content.area.busRoutes[existingIndex] = {
        ...content.area.busRoutes[existingIndex],
        title: defaultRoute.title,
        distance: defaultRoute.distance,
        description: defaultRoute.description,
        details: defaultRoute.details,
        link: defaultRoute.link,
      }
    })
  }

  if (storedVersion < 21) {
    content.version = defaultSiteContent.version

    const defaultHighlight = cloneContent(defaultSiteContent).about.highlights.find(
      (item) => item.id === 'quiet-garden',
    )
    const highlightIndex = content.about.highlights.findIndex((item) => item.id === 'quiet-garden')

    if (defaultHighlight) {
      if (highlightIndex === -1) {
        content.about.highlights.push(defaultHighlight)
      } else {
        content.about.highlights[highlightIndex] = {
          ...content.about.highlights[highlightIndex],
          icon: defaultHighlight.icon,
          title: defaultHighlight.title,
          description: defaultHighlight.description,
        }
      }
    }

    const defaultAmenities = cloneContent(defaultSiteContent).amenities

    for (const amenityId of ['grill', 'garden']) {
      const defaultAmenity = defaultAmenities.find((item) => item.id === amenityId)
      const amenityIndex = content.amenities.findIndex((item) => item.id === amenityId)

      if (!defaultAmenity) continue

      if (amenityIndex === -1) {
        content.amenities.push(defaultAmenity)
      } else {
        content.amenities[amenityIndex] = {
          ...content.amenities[amenityIndex],
          icon: defaultAmenity.icon,
          title: defaultAmenity.title,
          description: defaultAmenity.description,
        }
      }
    }
  }

  if (storedVersion < 22) {
    content.version = defaultSiteContent.version
    content.pricing.discounts = (content.pricing.discounts ?? []).map((discount) => ({
      ...discount,
      type: discount.type ?? 'permanent',
    }))
  }

  if (storedVersion < 23) {
    content.version = defaultSiteContent.version

    if (isPreviousHeroImage(content.hero.image.src)) {
      content.hero.image = defaultSiteContent.hero.image
    }

    if (!content.hero.mobileImage || isPreviousHeroImage(content.hero.mobileImage.src)) {
      content.hero.mobileImage = defaultSiteContent.hero.mobileImage
    }

    if (isPreviousHeroImage(content.seo.home.ogImage)) {
      content.seo.home.ogImage = defaultSiteContent.seo.home.ogImage
    }
  }

  if (storedVersion < 24) {
    content.version = defaultSiteContent.version
    content.hero.eyebrow = structuredClone(defaultSiteContent.hero.eyebrow)
    content.hero.slogan = structuredClone(defaultSiteContent.hero.slogan)
    content.hero.lead = structuredClone(defaultSiteContent.hero.lead)
    content.about.lead = structuredClone(defaultSiteContent.about.lead)
    content.area.lead = structuredClone(defaultSiteContent.area.lead)
    content.pricing.room1Nightly = defaultSiteContent.pricing.room1Nightly
    content.pricing.extraInfo = structuredClone(defaultSiteContent.pricing.extraInfo)
    content.seo.home.title = structuredClone(defaultSiteContent.seo.home.title)
    content.seo.home.description = structuredClone(defaultSiteContent.seo.home.description)

    const defaultDabrowaItem = structuredClone(
      defaultSiteContent.area.items.find((item) => item.id === 'dabrowa-chelminska'),
    )

    if (defaultDabrowaItem && !content.area.items.some((item) => item.id === defaultDabrowaItem.id)) {
      const chelmnoIndex = content.area.items.findIndex((item) => item.id === 'chelmno')
      content.area.items.splice(chelmnoIndex === -1 ? content.area.items.length : chelmnoIndex, 0, defaultDabrowaItem)
    }

    const upsertFaq = (item: SiteContent['faq'][number] | undefined) => {
      if (!item) return

      const nextItem = structuredClone(item)
      const existingIndex = content.faq.findIndex((faqItem) => faqItem.id === nextItem.id)

      if (existingIndex >= 0) {
        content.faq[existingIndex] = nextItem
        return
      }

      const bookingConfirmationIndex = content.faq.findIndex((faqItem) => faqItem.id === 'booking-confirmation')
      content.faq.splice(
        bookingConfirmationIndex === -1 ? content.faq.length : bookingConfirmationIndex,
        0,
        nextItem,
      )
    }

    upsertFaq(defaultSiteContent.faq.find((item) => item.id === 'pricing'))
    upsertFaq(defaultSiteContent.faq.find((item) => item.id === 'hotel-day'))
  }

  if (storedVersion < 25) {
    content.version = defaultSiteContent.version
    content.pricing.room2Nightly = 1600
    content.pricing.bothNightly = 2500
    content.pricing.room2Enabled = true
    content.pricing.room1Capacity = 6
    content.pricing.maxGuests = 14
    content.pricing.extraInfo = structuredClone(defaultSiteContent.pricing.extraInfo)
    content.hero.lead = structuredClone(defaultSiteContent.hero.lead)
    content.about.title = structuredClone(defaultSiteContent.about.title)
    content.about.lead = structuredClone(defaultSiteContent.about.lead)
    content.area.lead = structuredClone(defaultSiteContent.area.lead)

    for (const locale of ['pl', 'en'] as const) {
      content.about.body[locale] = content.about.body[locale].replaceAll('12:00', '11:00')
      const poolCopy = defaultSiteContent.amenities.find((item) => item.id === 'pool')!
      const eventCopy = defaultSiteContent.faq.find((item) => item.id === 'terrace-events')!
      if (!content.about.body[locale].includes(poolCopy.description[locale])) {
        content.about.body[locale] += `\n\n${poolCopy.description[locale]}`
      }
      if (!content.about.body[locale].includes(eventCopy.answer[locale])) {
        content.about.body[locale] += `\n\n${eventCopy.answer[locale]}`
      }
    }

    for (const id of ['pool', 'sauna']) {
      const item = structuredClone(defaultSiteContent.amenities.find((amenity) => amenity.id === id)!)
      const index = content.amenities.findIndex((amenity) => amenity.id === id)
      if (index >= 0) content.amenities[index] = item
      else content.amenities.push(item)
    }
    const torun = defaultSiteContent.area.items.find((item) => item.id === 'torun')
    if (torun && !content.area.items.some((item) => item.id === 'torun')) {
      content.area.items.push(structuredClone(torun))
    }
    for (const id of ['capacity', 'pool', 'pricing', 'hotel-day', 'terrace-events']) {
      const item = structuredClone(defaultSiteContent.faq.find((faq) => faq.id === id)!)
      const index = content.faq.findIndex((faq) => faq.id === id)
      if (index >= 0) content.faq[index] = item
      else content.faq.push(item)
    }
  }

  if (storedVersion < 26) {
    content.version = defaultSiteContent.version
    const existingTimes = content.faq.find((item) => item.id === 'hotel-day')?.answer.pl.match(/\b\d{2}:\d{2}\b/g)
    if (existingTimes?.[0] && content.pricing.checkInTime === defaultSiteContent.pricing.checkInTime) content.pricing.checkInTime = existingTimes[0]
    if (existingTimes?.[1] && content.pricing.checkOutTime === defaultSiteContent.pricing.checkOutTime) content.pricing.checkOutTime = existingTimes[1]
    content.pricing.weeksaveBaseNightly ??= defaultSiteContent.pricing.weeksaveBaseNightly
    content.pricing.weeksaveExtraGuestNightly ??= defaultSiteContent.pricing.weeksaveExtraGuestNightly

    // Convert existing mentions to live variables without replacing unrelated admin text.
    const replacements = [
      [new RegExp(`\\b${content.pricing.checkInTime}\\b`, 'g'), '{{checkInTime}}'],
      [new RegExp(`\\b${content.pricing.checkOutTime}\\b`, 'g'), '{{checkOutTime}}'],
      [/\b1000\s*(?:zł|PLN)/g, '{{priceGround}}'],
      [/\b1600\s*(?:zł|PLN)/g, '{{priceUpper}}'],
      [/\b2500\s*(?:zł|PLN)/g, '{{priceBoth}}'],
      [new RegExp(`\\b${String(content.pricing.room1Nightly).replace('.', '\\.')}\\s*(?:zł|PLN)`, 'g'), '{{priceGround}}'],
      [new RegExp(`\\b${String(content.pricing.room2Nightly).replace('.', '\\.')}\\s*(?:zł|PLN)`, 'g'), '{{priceUpper}}'],
      [new RegExp(`\\b${String(content.pricing.bothNightly).replace('.', '\\.')}\\s*(?:zł|PLN)`, 'g'), '{{priceBoth}}'],
      [/\b6(?= osób| guests)/g, '{{capacityGround}}'],
      [/\b8(?= osób| guests)/g, '{{capacityUpper}}'],
      [/\b14(?= osób| guests)/g, '{{maxGuests}}'],
      [/\b15:00\b/g, '{{checkInTime}}'],
      [/\b(?:11:00|12:00)\b/g, '{{checkOutTime}}'],
    ] as const
    const tokenize = (value: unknown, localized = false): unknown => {
      if (typeof value === 'string' && localized) {
        let text = value
        for (const [pattern, token] of replacements) text = text.replace(pattern, token)
        return text
      }
      if (Array.isArray(value)) return value.map((item) => tokenize(item, localized))
      if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, item]) =>
          [key, tokenize(item, localized || key === 'pl' || key === 'en')],
        ))
      }
      return value
    }
    content = tokenize(content) as SiteContent
    for (const item of content.faq) {
      for (const locale of ['pl', 'en'] as const) {
        const answer = item.answer[locale]
        if (item.id === 'capacity' && /^(Apartament na parterze mieści|The ground-floor apartment accommodates)/.test(answer)) {
          item.answer[locale] = '{{capacitySummary}}'
        }
        if (item.id === 'pricing' && /^(Apartament na parterze kosztuje|The ground-floor apartment costs)/.test(answer)) {
          item.answer[locale] = '{{pricingSummary}}'
        }
      }
    }
  }

  if (storedVersion < 27) {
    content.hero.mobileUsesDesktop = !content.hero.mobileImage || content.hero.mobileImage.src === content.hero.image.src
    content.version = defaultSiteContent.version
    const tokenizeBrand = (value: unknown, localized = false): unknown => {
      if (typeof value === 'string' && localized) return value.replaceAll('Gerka Pool House', '{{brandName}}')
      if (Array.isArray(value)) return value.map((item) => tokenizeBrand(item, localized))
      if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) =>
        [key, tokenizeBrand(item, localized || key === 'pl' || key === 'en')],
      ))
      return value
    }
    content = tokenizeBrand(content) as SiteContent
  }

  return removeExpiredAvailability(repairBundledAssetPaths(content))
}

export const contentRepository = {
  loadLocal(): SiteContent {
    if (typeof window === 'undefined') return cloneContent(defaultSiteContent)

    const stored = window.localStorage.getItem(storageKey)
    if (!stored) return cloneContent(defaultSiteContent)

    try {
      const parsed = JSON.parse(stored) as Partial<SiteContent>
      const storedVersion = typeof parsed.version === 'number' ? parsed.version : 0
      const previousAvailabilityCount = parsed.availability?.length ?? 0
      const migrated = migrateContent(mergeDeep(cloneContent(defaultSiteContent), parsed), storedVersion)

      if (
        storedVersion < defaultSiteContent.version ||
        migrated.availability.length !== previousAvailabilityCount
      ) {
        window.localStorage.setItem(storageKey, JSON.stringify(migrated))
      }

      return migrated
    } catch {
      return cloneContent(defaultSiteContent)
    }
  },

  async load(): Promise<SiteContent> {
    if (isSupabaseConfigured) {
      const parsed = await loadPublicContent()

      if (parsed) {
        const storedVersion = typeof parsed.version === 'number' ? parsed.version : 0
        const previousAvailabilityCount = parsed.availability?.length ?? 0
        const next = migrateContent(mergeDeep(cloneContent(defaultSiteContent), parsed), storedVersion)

        if (
          (storedVersion < defaultSiteContent.version || next.availability.length !== previousAvailabilityCount) &&
          hasSupabaseAuthSession()
        ) {
          const supabase = await getSupabaseClient()

          if (supabase) {
            try {
              return await this.save(next)
            } catch {
              // The cleaned content still remains active locally if persistence temporarily fails.
            }
          }
        }

        this.saveLocal(next)
        return next
      }
    }

    return this.loadLocal()
  },

  saveLocal(content: SiteContent) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, JSON.stringify(content))
    }

    return content
  },

  async save(content: SiteContent) {
    const pricing = content.pricing
    if (!Number.isInteger(pricing.room1Capacity) || pricing.room1Capacity < 1 ||
      !Number.isInteger(pricing.maxGuests) || pricing.maxGuests < pricing.room1Capacity ||
      (pricing.room2Enabled && pricing.maxGuests <= pricing.room1Capacity) ||
      !Number.isInteger(pricing.minStayNights) || pricing.minStayNights < 1) {
      throw new Error('Invalid apartment capacity or minimum stay')
    }
    for (const time of [content.pricing.checkInTime, content.pricing.checkOutTime]) {
      if (time !== undefined && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
        throw new Error('Invalid check-in or check-out time')
      }
    }
    for (const price of [content.pricing.room1Nightly, content.pricing.room2Nightly,
      content.pricing.bothNightly, content.pricing.weeksaveBaseNightly, content.pricing.weeksaveExtraGuestNightly]) {
      if (price !== undefined && (!Number.isFinite(price) || price < 0)) throw new Error('Invalid price')
    }
    const next = removeExpiredAvailability({
      ...content,
      version: defaultSiteContent.version,
      updatedAt: new Date().toISOString(),
    })
    const supabase = await getSupabaseClient()

    if (supabase) {
      const { error } = await supabase
        .from(tableName)
        .upsert({ id: contentId, content: next, updated_at: next.updatedAt }, { onConflict: 'id' })

      if (error) throw error
    }

    this.saveLocal(next)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(contentChangedEvent))
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel(contentChannelName)
        channel.postMessage({ type: contentChangedEvent })
        channel.close()
      }
    }
    return next
  },

  async cleanupExpiredAvailability() {
    const supabase = await getSupabaseClient()
    if (!supabase) return null

    const { data, error } = await supabase.from(tableName).select('content').eq('id', contentId).maybeSingle()
    if (error || !data?.content) return null

    const parsed = data.content as Partial<SiteContent>
    const storedVersion = typeof parsed.version === 'number' ? parsed.version : 0
    const merged = mergeDeep(cloneContent(defaultSiteContent), parsed)
    const previousCount = merged.availability?.length ?? 0
    const next = migrateContent(merged, storedVersion)

    if (next.availability.length === previousCount) return null

    return this.save(next)
  },

  async reset() {
    const next = cloneContent(defaultSiteContent)

    return this.save(next)
  },

  subscribe(onChange: () => void | Promise<void>) {
    if (typeof window === 'undefined') return () => undefined

    let active = true

    const notify = () => {
      if (active) void onChange()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') notify()
    }
    const interval = isSupabaseConfigured ? window.setInterval(notify, 60 * 1000) : undefined
    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) notify()
    }
    const channel = 'BroadcastChannel' in window ? new BroadcastChannel(contentChannelName) : null
    if (channel) channel.onmessage = (event) => {
      if (event.data?.type === contentChangedEvent) notify()
    }

    window.addEventListener(contentChangedEvent, notify)
    window.addEventListener('storage', handleStorage)
    window.addEventListener('focus', notify)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      active = false
      if (interval) window.clearInterval(interval)
      channel?.close()
      window.removeEventListener(contentChangedEvent, notify)
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('focus', notify)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  },
}
