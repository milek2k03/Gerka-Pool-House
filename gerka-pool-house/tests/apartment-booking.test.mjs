import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import ts from 'typescript'

// Load the application's TypeScript directly without generated test artifacts.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && context.parentURL) {
      const url = new URL(specifier, context.parentURL)
      if (url.pathname.endsWith('.js') && existsSync(fileURLToPath(url).slice(0, -3) + '.ts')) return nextResolve(url.href.slice(0, -3) + '.ts', context)
      if (!existsSync(fileURLToPath(url))) {
        for (const extension of ['.ts', '.tsx']) {
          if (existsSync(fileURLToPath(url) + extension)) return nextResolve(url.href + extension, context)
        }
      }
    }
    return nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    if (/\.(webp|avif|png)$/.test(url)) {
      return { format: 'module', shortCircuit: true, source: `export default ${JSON.stringify(url)}` }
    }
    if (/\.tsx?$/.test(url)) {
      const source = readFileSync(fileURLToPath(url), 'utf8').replaceAll('import.meta.env', '({})')
      return { format: 'module', shortCircuit: true, source: ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
      }).outputText }
    }
    return nextLoad(url, context)
  },
})

const { calculateStaySummary } = await import('../src/features/booking/booking.utils.ts')
const { getReservationApartment, apartmentsOverlap } = await import('../src/utils/apartments.ts')
const { reservationRepository } = await import('../src/services/reservationRepository.ts')
const pricing = { room1Nightly: 600, room2Nightly: 450, room2Enabled: true,
  room1Capacity: 4, maxGuests: 8, minStayNights: 2, discounts: [], currency: 'PLN' }
const blocked = [{ id: 'ground-booking', from: '2099-06-10', to: '2099-06-14', status: 'booked', apartment: 'ground' }]
const summary = (apartment, availability = blocked, guests = 2, settings = pricing, from = '2099-06-10', to = '2099-06-14') =>
  calculateStaySummary(from, to, guests, settings, availability, '', apartment)

test('ground-floor reservation leaves upstairs available and blocks a booking of both', () => {
  assert.equal(summary('ground').isAvailable, false)
  assert.equal(summary('upper').isValid, true)
  assert.equal(summary('both').isAvailable, false)
})
test('upstairs reservation leaves the ground floor available', () => {
  const upper = [{ ...blocked[0], apartment: 'upper' }]
  assert.equal(summary('ground', upper).isValid, true)
  assert.equal(summary('upper', upper).isAvailable, false)
  assert.equal(summary('both', upper).isAvailable, false)
})
test('booking both apartments blocks each calendar', () => {
  for (const apartment of ['ground', 'upper', 'both']) {
    assert.equal(summary(apartment, [{ ...blocked[0], apartment: 'both' }]).isAvailable, false)
  }
})
test('manual blocks apply to the selected apartment; legacy blocks cover both', () => {
  const manual = [{ ...blocked[0], status: 'unavailable', apartment: 'upper' }]
  assert.equal(summary('ground', manual).isValid, true)
  assert.equal(summary('upper', manual).reason, 'unavailable')
  const legacy = [{ ...blocked[0], apartment: undefined }]
  assert.equal(summary('ground', legacy).isAvailable, false)
  assert.equal(summary('upper', legacy).isAvailable, false)
})
test('price follows the apartment choice, even for a small group booking both', () => {
  assert.equal(summary('ground', []).estimatedTotal, 2400)
  assert.equal(summary('upper', []).estimatedTotal, 1800)
  assert.equal(summary('both', []).estimatedTotal, 4200)
  assert.equal(summary('both', []).roomsUsed, 2)
})
test('guest limits follow apartment capacity and disabled upstairs cannot be booked', () => {
  assert.equal(summary('ground', [], 5).reason, 'guestLimit')
  assert.equal(summary('upper', [], 5).reason, 'guestLimit')
  assert.equal(summary('both', [], 8).isValid, true)
  assert.equal(summary('upper', [], 2, { ...pricing, room2Enabled: false }).isValid, false)
  assert.equal(summary('both', [], 2, { ...pricing, room2Enabled: false }).isValid, false)
})
test('checkout day is free and adjacent stays do not conflict', () => {
  assert.equal(summary('ground', blocked, 2, pricing, '2099-06-14', '2099-06-16').isValid, true)
  assert.equal(summary('ground', blocked, 2, pricing, '2099-06-08', '2099-06-10').isValid, true)
})
test('legacy reservations preserve their apartment allocation', () => {
  assert.equal(getReservationApartment({ roomsUsed: 1 }), 'ground')
  assert.equal(getReservationApartment({ roomsUsed: 2 }), 'both')
  assert.equal(getReservationApartment({ roomsUsed: 1, apartment: 'upper' }), 'upper')
  assert.equal(apartmentsOverlap('ground', 'upper'), false)
})
test('reservations persist apartment choice and accepted bookings block only that apartment', async () => {
  const storage = new Map()
  globalThis.window = Object.assign(new EventTarget(), {
    localStorage: { getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) },
  })
  try {
    const inquiry = { fullName: 'Test Guest', email: 'test@example.com', phone: '123456789', guests: 2,
      checkIn: '2099-06-10', checkOut: '2099-06-14', nights: 4, roomsUsed: 1,
      nightlyPrice: 450, estimatedTotal: 1800, message: '', apartment: 'upper' }
    const upper = await reservationRepository.add(inquiry)
    assert.equal((await reservationRepository.list())[0].apartment, 'upper')
    assert.deepEqual(await reservationRepository.listAcceptedAvailability(), [])
    await reservationRepository.updateStatus(upper.id, 'accepted')
    assert.equal(summary('ground', await reservationRepository.listAcceptedAvailability()).isValid, true)
    assert.equal(summary('upper', await reservationRepository.listAcceptedAvailability()).isAvailable, false)
    const ground = await reservationRepository.add({ ...inquiry, apartment: 'ground' })
    await reservationRepository.updateStatus(ground.id, 'accepted')
    const both = await reservationRepository.add({ ...inquiry, apartment: 'both', roomsUsed: 2 })
    await assert.rejects(reservationRepository.updateStatus(both.id, 'accepted'), /already booked/)
    await reservationRepository.updateStatus(upper.id, 'cancelled')
    assert.equal(summary('upper', await reservationRepository.listAcceptedAvailability()).isValid, true)
    assert.equal(summary('ground', await reservationRepository.listAcceptedAvailability()).isAvailable, false)
  } finally {
    delete globalThis.window
  }
})


test('upstairs fits 8 guests and the whole property uses its separate 2500 PLN rate', () => {
  const settings = { ...pricing, room1Nightly: 1000, room2Nightly: 1600,
    bothNightly: 2500, room1Capacity: 6, maxGuests: 14 }
  assert.equal(summary('upper', [], 8, settings).nightlyPrice, 1600)
  assert.equal(summary('upper', [], 9, settings).reason, 'guestLimit')
  assert.equal(summary('both', [], 14, settings).nightlyPrice, 2500)
  assert.equal(summary('both', [], 14, settings).estimatedTotal, 10000)
})

test('stored site content receives new rates and amenities while preserving manual blocks', async () => {
  const { defaultSiteContent } = await import('../src/constants/defaultContent.ts')
  const { contentRepository } = await import('../src/services/contentRepository.ts')
  const legacy = structuredClone(defaultSiteContent)
  legacy.version = 24
  legacy.pricing.room2Nightly = 300
  legacy.pricing.room2Enabled = false
  delete legacy.pricing.bothNightly
  legacy.amenities = legacy.amenities.filter((item) => item.id !== 'sauna')
  legacy.area.items = legacy.area.items.filter((item) => item.id !== 'torun')
  legacy.pricing.extraInfo.pl = 'Check-out 12:00'
  legacy.availability = [{ ...blocked[0], status: 'unavailable' }]
  const stored = new Map([['gerka-pool-house:site-content:v1', JSON.stringify(legacy)]])
  globalThis.window = { localStorage: {
    getItem: (key) => stored.get(key) ?? null,
    setItem: (key, value) => stored.set(key, value),
  } }
  try {
    const migrated = contentRepository.loadLocal()
    assert.equal(migrated.version, 27)
    assert.equal(migrated.pricing.room2Nightly, 1600)
    assert.equal(migrated.pricing.bothNightly, 2500)
    assert.equal(migrated.pricing.room2Enabled, true)
    assert.match(migrated.pricing.extraInfo.en, /\{\{checkOutTime\}\}/)
    assert.ok(migrated.amenities.some((item) => item.id === 'sauna'))
    assert.ok(migrated.area.items.some((item) => item.id === 'torun'))
    assert.match(migrated.amenities.find((item) => item.id === 'pool').description.en, /1 May to 30 September/)
    assert.match(migrated.faq.find((item) => item.id === 'terrace-events').answer.en, /Pricing is agreed individually/)
    assert.deepEqual(migrated.availability, legacy.availability)
    assert.deepEqual(migrated.gallerySections, legacy.gallerySections)
    // Once saved, admin changes must survive subsequent loads.
    migrated.pricing.room2Enabled = false
    migrated.pricing.bothNightly = 2400
    contentRepository.saveLocal(migrated)
    assert.equal(contentRepository.loadLocal().pricing.room2Enabled, false)
    assert.equal(contentRepository.loadLocal().pricing.bothNightly, 2400)
  } finally {
    delete globalThis.window
  }
})


test('admin changes update descriptions, pricing, FAQ and SEO in both languages without overwriting templates', async () => {
  const { defaultSiteContent } = await import('../src/constants/defaultContent.ts')
  const { resolveSiteContent } = await import('../src/utils/contentTemplates.ts')
  const { buildHomeSchema } = await import('../src/utils/schema.ts')
  const { formatMoney } = await import('../src/utils/format.ts')
  const { default: React } = await import('react')
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { default: i18n } = await import('i18next')
  const { initReactI18next } = await import('react-i18next')
  const { pl } = await import('../src/locales/pl/translation.ts')
  const { en } = await import('../src/locales/en/translation.ts')
  await i18n.use(initReactI18next).init({ resources: { pl: { translation: pl }, en: { translation: en } },
    lng: 'pl', fallbackLng: 'pl', interpolation: { escapeValue: false } })
  const { PricingSection } = await import('../src/sections/PricingSection.tsx')
  const { FaqSection } = await import('../src/sections/FaqSection.tsx')
  const { BookingForm } = await import('../src/features/booking/BookingForm.tsx')
  const raw = structuredClone(defaultSiteContent)
  Object.assign(raw.pricing, { room1Nightly: 1234, room2Nightly: 1876, bothNightly: 2875,
    checkInTime: '16:30', checkOutTime: '10:15', weeksaveBaseNightly: 650, weeksaveExtraGuestNightly: 175 })
  for (const locale of ['pl', 'en']) {
    await i18n.changeLanguage(locale)
    const resolved = resolveSiteContent(raw)
    const priceGround = formatMoney(1234, locale, 'PLN')
    const priceUpper = formatMoney(1876, locale, 'PLN')
    const priceBoth = formatMoney(2875, locale, 'PLN')
    const pricingFaq = resolved.faq.find((item) => item.id === 'pricing').answer[locale]
    for (const price of [priceGround, priceUpper, priceBoth]) assert.ok(pricingFaq.includes(price))
    assert.match(resolved.faq.find((item) => item.id === 'hotel-day').answer[locale], /16:30.*10:15/)
    const markup = renderToStaticMarkup(React.createElement(PricingSection, { pricing: resolved.pricing, locale }))
    assert.ok(markup.includes(priceGround))
    assert.ok(markup.includes(priceUpper))
    assert.ok(markup.includes(priceBoth))
    assert.match(markup, /16:30/)
    assert.match(markup, /10:15/)
    assert.ok(markup.includes(formatMoney(650, locale, 'PLN')))
    assert.ok(markup.includes(formatMoney(175, locale, 'PLN')))
    const faqMarkup = renderToStaticMarkup(React.createElement(FaqSection, { items: resolved.faq, pricing: resolved.pricing, locale }))
    assert.ok(faqMarkup.includes(priceBoth))
    assert.match(faqMarkup, /10:15/)
    const schema = buildHomeSchema(raw, locale)
    const lodging = schema['@graph'].find((item) => item['@type'] === 'LodgingBusiness')
    assert.equal(lodging.checkinTime, '16:30')
    assert.equal(lodging.checkoutTime, '10:15')
    assert.equal(lodging.priceRange, '1234-2875 PLN')
    assert.ok(JSON.stringify(schema).includes(priceBoth))
    raw.pricing.room2Enabled = false
    const single = resolveSiteContent(raw)
    const bookingMarkup = renderToStaticMarkup(React.createElement(BookingForm, { content: single, locale }))
    // The single-apartment pricing lead must also use the current setting.
    const singleMarkup = renderToStaticMarkup(React.createElement(PricingSection, { pricing: single.pricing, locale }))
    assert.ok(singleMarkup.includes(priceGround))
    assert.ok(!singleMarkup.includes('1000'))
    assert.ok(!bookingMarkup.includes('1000'))
    raw.pricing.room2Enabled = true
  }
  assert.match(raw.pricing.extraInfo.pl, /\{\{priceGround\}\}/)
  assert.equal(raw.pricing.checkOutTime, '10:15')
})

test('weekday offer calculations use the same configurable rates as the displayed offer', () => {
  const settings = { ...pricing, weeksaveBaseNightly: 650, weeksaveExtraGuestNightly: 175 }
  // 2099-06-15 is Monday; every selected night is a weekday.
  const stay = calculateStaySummary('2099-06-15', '2099-06-17', 3, settings, [], '', 'ground')
  assert.equal(stay.discountKind, 'weeksave')
  assert.equal(stay.estimatedTotal, (650 + 175) * 2)
})


test('saving settings notifies another subscriber and preserves reusable templates', async () => {
  const { defaultSiteContent } = await import('../src/constants/defaultContent.ts')
  const { contentRepository } = await import('../src/services/contentRepository.ts')
  const storage = new Map()
  globalThis.window = Object.assign(new EventTarget(), { localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  } })
  globalThis.document = Object.assign(new EventTarget(), { visibilityState: 'visible' })
  let changes = 0
  const unsubscribe = contentRepository.subscribe(() => { changes++ })
  try {
    const raw = structuredClone(defaultSiteContent)
    raw.pricing.checkOutTime = '09:45'
    raw.pricing.room1Nightly = 1450
    await contentRepository.save(raw)
    assert.equal(changes, 1)
    assert.equal(contentRepository.loadLocal().pricing.checkOutTime, '09:45')
    assert.match(contentRepository.loadLocal().pricing.extraInfo.pl, /\{\{priceGround\}\}/)
    window.dispatchEvent(Object.assign(new Event('storage'), { key: 'unrelated' }))
    assert.equal(changes, 1)
    window.dispatchEvent(Object.assign(new Event('storage'), { key: 'gerka-pool-house:site-content:v1' }))
    assert.equal(changes, 2)
    const invalid = structuredClone(raw)
    invalid.pricing.checkOutTime = '99:99'
    await assert.rejects(contentRepository.save(invalid), /Invalid check-in or check-out time/)
    invalid.pricing.checkOutTime = '09:45'
    invalid.pricing.bothNightly = -1
    await assert.rejects(contentRepository.save(invalid), /Invalid price/)
    unsubscribe()
    window.dispatchEvent(Object.assign(new Event('storage'), { key: 'gerka-pool-house:site-content:v1' }))
    assert.equal(changes, 2)
  } finally {
    unsubscribe()
    delete globalThis.window
    delete globalThis.document
  }
})


test('migration keeps admin-edited times and converts older literal descriptions into live values', async () => {
  const { defaultSiteContent } = await import('../src/constants/defaultContent.ts')
  const { contentRepository } = await import('../src/services/contentRepository.ts')
  const { resolveSiteContent } = await import('../src/utils/contentTemplates.ts')
  const legacy = structuredClone(defaultSiteContent)
  legacy.version = 25
  delete legacy.pricing.checkInTime
  delete legacy.pricing.checkOutTime
  legacy.faq.find((item) => item.id === 'hotel-day').answer = {
    pl: 'Zameldowanie 16:30, wymeldowanie 10:15.', en: 'Check-in 16:30, check-out 10:15.',
  }
  legacy.pricing.extraInfo = { pl: '1000 PLN, 1600 PLN, 2500 PLN. 16:30 - 10:15.',
    en: '1000 PLN, 1600 PLN, 2500 PLN. 16:30 - 10:15.' }
  const stored = new Map([['gerka-pool-house:site-content:v1', JSON.stringify(legacy)]])
  globalThis.window = { localStorage: { getItem: (key) => stored.get(key) ?? null,
    setItem: (key, value) => stored.set(key, value) } }
  try {
    const migrated = contentRepository.loadLocal()
    assert.equal(migrated.pricing.checkInTime, '16:30')
    assert.equal(migrated.pricing.checkOutTime, '10:15')
    assert.match(migrated.pricing.extraInfo.en, /\{\{priceGround\}\}/)
    migrated.pricing.checkOutTime = '09:30'
    migrated.pricing.room1Nightly = 1350
    const rendered = resolveSiteContent(migrated)
    assert.match(rendered.faq.find((item) => item.id === 'hotel-day').answer.en, /09:30/)
    assert.ok(!rendered.pricing.extraInfo.en.includes('1000'))
    assert.match(rendered.pricing.extraInfo.en, /09:30/)
  } finally {
    delete globalThis.window
  }
})


test('public sections render edited contact data, branding, descriptions, media and area information', async () => {
  const { defaultSiteContent } = await import('../src/constants/defaultContent.ts')
  const { resolveSiteContent } = await import('../src/utils/contentTemplates.ts')
  const { default: React } = await import('react')
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { MemoryRouter } = await import('react-router')
  const { SiteContentContext } = await import('../src/app/siteContentContext.ts')
  const { HeroSection } = await import('../src/sections/HeroSection.tsx')
  const { HomeDeferredSections } = await import('../src/sections/HomeDeferredSections.tsx')
  const { Footer } = await import('../src/components/common/Footer.tsx')
  const { PrivacyPage } = await import('../src/pages/PrivacyPage.tsx')
  const { CookiesPage } = await import('../src/pages/CookiesPage.tsx')
  const { default: i18n } = await import('i18next')
  const raw = structuredClone(defaultSiteContent)
  raw.brandName = 'New Pool House'
  raw.logoText = 'NPH'
  Object.assign(raw.contact, { phone: '+48 111 222 333', secondaryPhone: '+48 444 555 666',
    email: 'new-contact@example.com', facebookUrl: 'https://facebook.com/new-pool',
    instagramUrl: 'https://instagram.com/new-pool', mapEmbedUrl: 'https://www.google.com/maps/embed?pb=new-map' })
  raw.contact.address = { pl: 'New address PL', en: 'New address EN' }
  raw.hero.image = { src: 'https://images.example/new-desktop.jpg' }
  raw.hero.mobileImage = { src: 'https://images.example/new-mobile.jpg' }
  raw.hero.mobileUsesDesktop = false
  raw.area.image = { src: 'https://images.example/new-area.jpg' }
  const localized = (value) => ({ pl: `${value} PL`, en: `${value} EN` })
  raw.hero.eyebrow = localized('Edited eyebrow')
  raw.hero.slogan = localized('Edited slogan')
  raw.hero.lead = localized('Edited lead')
  raw.about.title = localized('Edited about title')
  raw.about.lead = localized('Edited about lead')
  raw.about.body = { pl: 'Opis dla 3 go?ci.', en: 'Custom group of up to 3 guests.' }
  raw.about.highlights[0].description = { pl: 'Osobny opis dla 3 os?b.', en: 'Custom highlight for up to 3 guests.' }
  raw.amenities = [{ id: 'custom-amenity', icon: 'wifi', title: localized('New amenity'), description: localized('New amenity description') }]
  raw.area.title = localized('Edited area title')
  raw.area.lead = localized('Edited area lead')
  raw.area.items = [{ id: 'new-place', icon: 'landmark', title: localized('New place'), description: localized('New place description'), distance: localized('New distance') }]
  raw.area.restaurants = [{ id: 'new-restaurant', title: localized('Edited restaurant'), description: localized('Edited restaurant description'), distance: localized('Edited restaurant distance'), details: [localized('Edited dish')] }]
  raw.area.nearby = [{ id: 'new-nearby', title: localized('Edited nearby'), description: localized('Edited nearby description'), distance: localized('Edited nearby distance') }]
  raw.area.airports = [{ id: 'new-airport', title: localized('Edited airport'), description: localized('Edited airport description'), distance: localized('Edited airport distance') }]
  raw.area.bikeRoutes = { title: localized('Edited cycling title'), lead: localized('Edited cycling lead'), routes: [localized('Edited cycling route')] }
  raw.area.busRoutes = [{ id: 'new-bus', title: localized('New bus'), description: localized('New bus description'), distance: localized('New stop'), link: { label: localized('New timetable'), href: 'https://example.com/new-timetable' } }]
  raw.gallerySections = [{ id: 'apartment-1', title: localized('Edited gallery'), lead: localized('Edited gallery lead'), items: [{ id: 'new-photo', title: localized('Edited photo'), alt: localized('Edited alt'), image: { src: 'https://images.example/new-gallery.jpg' } }] }]
  raw.faq = [{ id: 'custom-faq', question: localized('Edited question'), answer: localized('Edited answer') }]
  for (const locale of ['pl', 'en']) {
    await i18n.changeLanguage(locale)
    const resolved = resolveSiteContent(raw)
    const context = { content: raw, saveContent: async (value) => value, resetContent: async () => raw }
    const markup = renderToStaticMarkup(React.createElement(SiteContentContext.Provider, { value: context },
      React.createElement(MemoryRouter, null,
        React.createElement(React.Fragment, null,
          React.createElement(HeroSection, { content: resolved, locale }),
          React.createElement(HomeDeferredSections, { content: resolved, locale }),
          React.createElement(Footer), React.createElement(PrivacyPage), React.createElement(CookiesPage),
        ),
      ),
    ))
    for (const value of ['New Pool House', 'NPH', 'new-contact@example.com', '+48 111 222 333', '+48 444 555 666',
      `New address ${locale.toUpperCase()}`, 'https://facebook.com/new-pool', 'https://instagram.com/new-pool',
      'https://www.google.com/maps/embed?pb=new-map', 'https://images.example/new-desktop.jpg',
      'https://images.example/new-mobile.jpg', 'https://images.example/new-area.jpg',
      'https://images.example/new-gallery.jpg', 'https://example.com/new-timetable',
      `Edited eyebrow ${locale.toUpperCase()}`, `Edited about title ${locale.toUpperCase()}`,
      `New amenity ${locale.toUpperCase()}`, `Edited gallery ${locale.toUpperCase()}`,
      `Edited answer ${locale.toUpperCase()}`, `New place ${locale.toUpperCase()}`,
      `Edited restaurant ${locale.toUpperCase()}`, `Edited dish ${locale.toUpperCase()}`,
      `Edited nearby ${locale.toUpperCase()}`, `Edited airport ${locale.toUpperCase()}`,
      `Edited cycling route ${locale.toUpperCase()}`]) {
      assert.ok(markup.includes(value), `Missing edited setting: ${value}`)
    }
    assert.ok(!markup.includes('Gerka Pool House'))
    if (locale === 'en') assert.ok(markup.includes('Custom highlight for up to 3 guests.'))
  }
  raw.hero.mobileUsesDesktop = true
  raw.hero.image = { src: 'https://images.example/replaced-desktop.jpg' }
  assert.equal(resolveSiteContent(raw).hero.mobileImage.src, raw.hero.image.src)
  raw.hero.mobileUsesDesktop = false
  assert.equal(resolveSiteContent(raw).hero.mobileImage.src, 'https://images.example/new-mobile.jpg')
})

test('configured discount percentages, date windows and weekdays apply even to a code named WEEKSAVE', () => {
  const discount = { id: 'admin-weeksave', code: 'WEEKSAVE', percent: 30, type: 'dateRange',
    validFrom: '2099-06-10', validTo: '2099-06-13' }
  const settings = { ...pricing, discounts: [discount] }
  const stay = calculateStaySummary('2099-06-10', '2099-06-14', 2, settings, [], 'WEEKSAVE', 'ground')
  assert.equal(stay.discountPercent, 30)
  assert.equal(stay.estimatedTotal, 2400 * 0.7)
  const outside = calculateStaySummary('2099-06-10', '2099-06-15', 2, settings, [], 'WEEKSAVE', 'ground')
  assert.equal(outside.discountCode, undefined)
  const weekdays = { ...settings, discounts: [{ ...discount, type: 'recurring', weekdays: [1, 2] }] }
  assert.equal(calculateStaySummary('2099-06-15', '2099-06-17', 2, weekdays, [], 'WEEKSAVE', 'ground').discountPercent, 30)
  assert.equal(calculateStaySummary('2099-06-17', '2099-06-19', 2, weekdays, [], 'WEEKSAVE', 'ground').discountCode, undefined)
})

test('mail recipient is read from trusted saved admin settings rather than a stale server override', async () => {
  const { resolveReservationOwnerEmail } = await import('../api/_booking-settings.ts')
  const keys = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'RESERVATION_OWNER_EMAIL']
  const savedEnv = Object.fromEntries(keys.map((key) => [key, process.env[key]]))
  const originalFetch = globalThis.fetch
  try {
    process.env.SUPABASE_URL = 'https://configured.example'
    process.env.SUPABASE_ANON_KEY = 'test-public-key'
    process.env.RESERVATION_OWNER_EMAIL = 'old-owner@example.com'
    globalThis.fetch = async (url) => {
      assert.equal(url, 'https://configured.example/rest/v1/site_content?id=eq.main&select=content')
      return new Response(JSON.stringify([{ content: { booking: { ownerEmail: 'new-owner@example.com' } } }]))
    }
    assert.equal(await resolveReservationOwnerEmail('payload-owner@example.com'), 'new-owner@example.com')
    globalThis.fetch = async () => new Response('', { status: 503 })
    await assert.rejects(resolveReservationOwnerEmail('payload-owner@example.com'), /Could not load booking settings/)
    globalThis.fetch = async () => new Response(JSON.stringify([{ content: { booking: { ownerEmail: 'invalid' } } }]))
    await assert.rejects(resolveReservationOwnerEmail('payload-owner@example.com'), /Invalid reservation owner email/)
    for (const key of keys.slice(0, 4)) delete process.env[key]
    assert.equal(await resolveReservationOwnerEmail('payload-owner@example.com'), 'old-owner@example.com')
  } finally {
    globalThis.fetch = originalFetch
    for (const key of keys) {
      if (savedEnv[key] === undefined) delete process.env[key]
      else process.env[key] = savedEnv[key]
    }
  }
})

test('both supported Google embed formats render while malformed URLs are rejected', async () => {
  const { isMapEmbedUrl } = await import('../src/utils/contact.ts')
  assert.equal(isMapEmbedUrl('https://www.google.com/maps/embed?pb=example'), true)
  assert.equal(isMapEmbedUrl('https://www.google.com/maps?q=address&output=embed'), true)
  assert.equal(isMapEmbedUrl('https://evil.example/google.com/maps?output=embed'), false)
  assert.equal(isMapEmbedUrl('not-a-url'), false)
})


test('SEO links support editable absolute canonicals, query parameters and a cleared preview image', async () => {
  const { withLocaleQuery } = await import('../src/utils/locale.ts')
  const { buildHomeSchema } = await import('../src/utils/schema.ts')
  const { defaultSiteContent } = await import('../src/constants/defaultContent.ts')
  assert.equal(withLocaleQuery('https://example.com/stay?campaign=summer', 'en'), 'https://example.com/stay?campaign=summer&lng=en')
  assert.equal(withLocaleQuery('https://example.com/stay?lng=en&campaign=summer', 'pl'), 'https://example.com/stay?campaign=summer')
  const content = structuredClone(defaultSiteContent)
  content.seo.home.canonicalPath = 'https://example.com/new-canonical'
  content.seo.home.ogImage = ''
  content.hero.image = { src: 'https://images.example/new-preview.jpg' }
  const schema = buildHomeSchema(content, 'en')
  const lodging = schema['@graph'].find((item) => item['@type'] === 'LodgingBusiness')
  assert.equal(lodging.url, 'https://example.com/new-canonical')
  assert.equal(lodging.image, content.hero.image.src)
})
