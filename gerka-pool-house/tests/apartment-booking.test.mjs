import assert from 'node:assert/strict'
import test from 'node:test'

import './load-typescript.mjs'

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
    assert.equal(migrated.version, defaultSiteContent.version)
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
    assert.ok(!bookingMarkup.includes(formatMoney(1000, locale, 'PLN')))
    raw.pricing.room2Enabled = true
  }
  assert.match(raw.pricing.extraInfo.pl, /\{\{pricingSummary\}\}/)
  assert.equal(raw.pricing.checkOutTime, '10:15')
})

test('weekday offer calculations use the same configurable rates as the displayed offer', () => {
  const settings = { ...pricing, room1Nightly: 1000, weeksaveBaseNightly: 650, weeksaveExtraGuestNightly: 175 }
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
    assert.match(contentRepository.loadLocal().pricing.extraInfo.pl, /\{\{pricingSummary\}\}/)
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


test('invalid calendar dates, excessive stays and fractional guest counts cannot be booked', async () => {
  const { isISODate, nightsBetween } = await import('../src/utils/date.ts')
  assert.equal(isISODate('2099-02-31'), false)
  assert.equal(isISODate('2100-02-29'), false)
  assert.equal(isISODate('2096-02-29'), true)
  assert.equal(nightsBetween('broken', '2099-06-10'), 0)
  assert.equal(summary('ground', [], 2, pricing, '2099-02-31', '2099-03-05').isValid, false)
  assert.equal(summary('ground', [], 2, pricing, '2099-01-01', '2099-05-01').reason, 'maxStay')
  assert.equal(summary('ground', [], 2.5).reason, 'guestLimit')
})

test('frontend input limits match the server limits and preserve cents', async () => {
  const { bookingSchema } = await import('../src/features/booking/booking.schema.ts')
  const { formatMoney } = await import('../src/utils/format.ts')
  const valid = { apartment: 'ground', fullName: 'Example Guest', email: 'guest@example.com', phone: '123456789',
    checkIn: '2099-06-10', checkOut: '2099-06-12', guests: 2, privacyConsent: true }
  assert.equal(bookingSchema.safeParse(valid).success, true)
  assert.equal(bookingSchema.safeParse({ ...valid, fullName: 'a'.repeat(161) }).success, false)
  assert.equal(bookingSchema.safeParse({ ...valid, phone: '1'.repeat(41) }).success, false)
  assert.equal(bookingSchema.safeParse({ ...valid, checkIn: '2099-02-31' }).success, false)
  assert.match(formatMoney(1234.56, 'en', 'PLN'), /1,234\.56/)
  const settings = { ...pricing, room1Nightly: 1234.56, discounts: [{ id: 'percent', code: 'SAVE', percent: 15, type: 'permanent' }] }
  const stay = calculateStaySummary('2099-06-10', '2099-06-12', 2, settings, [], 'SAVE', 'ground')
  assert.equal(stay.priceBeforeDiscount, 2469.12)
  assert.equal(stay.discountAmount, 370.37)
  assert.equal(Math.round(stay.estimatedTotal * 100), 209875)
})

test('whole-house weekday promotion is supported as requested', () => {
  const settings = { ...pricing, room1Nightly: 1000, room2Nightly: 1600, bothNightly: 2500 }
  const stay = calculateStaySummary('2099-06-15', '2099-06-17', 2, settings, [], '', 'both')
  assert.equal(stay.estimatedTotal, 1000)
  assert.equal(stay.nightlyPrice, 2500)
  assert.equal(stay.discountKind, 'weeksave')
})

test('disabling upstairs updates stock titles, descriptions, FAQ and selectable capacity', async () => {
  const { defaultSiteContent } = await import('../src/constants/defaultContent.ts')
  const { resolveSiteContent } = await import('../src/utils/contentTemplates.ts')
  const content = structuredClone(defaultSiteContent)
  content.pricing.room2Enabled = false
  const resolved = resolveSiteContent(content)
  assert.ok(!resolved.about.title.en.includes('Two apartments'))
  assert.ok(!resolved.about.lead.en.includes('rent both'))
  assert.ok(!resolved.pricing.extraInfo.en.includes('Upstairs apartment'))
  assert.ok(!resolved.faq.find((item) => item.id === 'pricing').answer.en.includes('Both apartments'))
})

test('concurrent local editors cannot overwrite a newer saved configuration', async () => {
  const { defaultSiteContent } = await import('../src/constants/defaultContent.ts')
  const { contentRepository } = await import('../src/services/contentRepository.ts')
  const { ContentConflictError } = await import('../src/services/contentPersistence.ts')
  const storage = new Map()
  globalThis.window = Object.assign(new EventTarget(), { localStorage: {
    getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) } })
  try {
    contentRepository.saveLocal(structuredClone(defaultSiteContent))
    const first = contentRepository.loadLocal()
    const second = contentRepository.loadLocal()
    first.pricing.room1Nightly = 1500
    const saved = await contentRepository.save(first)
    second.pricing.room1Nightly = 1800
    await assert.rejects(contentRepository.save(second), ContentConflictError)
    assert.equal(contentRepository.loadLocal().pricing.room1Nightly, 1500)
    assert.equal(saved.updatedAt, contentRepository.loadLocal().updatedAt)
    const reset = await contentRepository.reset(saved)
    assert.equal(reset.pricing.room1Nightly, defaultSiteContent.pricing.room1Nightly)
  } finally { delete globalThis.window }
})

test('remote persistence checks revisions atomically and rejects a race after reading metadata', async () => {
  const { persistSiteContent, ContentConflictError } = await import('../src/services/contentPersistence.ts')
  const { defaultSiteContent } = await import('../src/constants/defaultContent.ts')
  const expected = '2026-10-13T10:00:00.000Z'
  const next = { ...structuredClone(defaultSiteContent), updatedAt: '2026-10-13T10:00:01.000Z' }
  const state = { timestamp: expected, race: false, writes: 0 }
  const client = { from() {
    let update = false
    let filter
    return {
      select() { return this },
      eq(key, value) { if (key === 'updated_at') filter = value; return this },
      update() { update = true; return this },
      async maybeSingle() {
        if (!update) {
          const data = { updated_at: state.timestamp }
          if (state.race) state.timestamp = '2026-10-13T10:00:02.000Z'
          return { data, error: null }
        }
        if (filter !== state.timestamp) return { data: null, error: null }
        state.writes++; state.timestamp = next.updatedAt
        return { data: { id: 'main' }, error: null }
      },
    }
  } }
  await persistSiteContent(client, next, expected)
  assert.equal(state.writes, 1)
  await assert.rejects(persistSiteContent(client, next, expected), ContentConflictError)
  state.timestamp = expected; state.race = true
  await assert.rejects(persistSiteContent(client, next, expected), ContentConflictError)
  assert.equal(state.writes, 1)
})

test('CSV output prevents spreadsheet formula execution in submitted guest data', async () => {
  const { escapeCsvCell } = await import('../src/utils/reservationExport.ts')
  assert.equal(escapeCsvCell('=HYPERLINK("https://example.com")').startsWith('"\''), true)
  assert.equal(escapeCsvCell('+48123456789'), '"\'+48123456789"')
  assert.equal(escapeCsvCell('A normal name'), '"A normal name"')
})


test('automatic weekday offer cannot increase the price above the ordinary rate', () => {
  const settings = { ...pricing, weeksaveBaseNightly: 9000, weeksaveExtraGuestNightly: 9000 }
  const stay = calculateStaySummary('2099-06-15', '2099-06-17', 2, settings, [], '', 'ground')
  assert.equal(stay.estimatedTotal, pricing.room1Nightly * 2)
  assert.equal(stay.discountCode, undefined)
})

test('invalid manual blocks and duplicate discount codes are rejected before saving', async () => {
  const { defaultSiteContent } = await import('../src/constants/defaultContent.ts')
  const { contentRepository } = await import('../src/services/contentRepository.ts')
  const content = structuredClone(defaultSiteContent)
  content.availability = [{ id: 'bad', from: '2099-02-31', to: '2099-03-10', apartment: 'upper', status: 'unavailable' }]
  await assert.rejects(contentRepository.save(content), /Invalid availability/)
  content.availability = []
  content.pricing.discounts = [{ id: 'a', code: 'SAVE', percent: 20, type: 'permanent' }, { id: 'b', code: ' save ', percent: 30, type: 'permanent' }]
  await assert.rejects(contentRepository.save(content), /duplicate discount/)
  content.pricing.discounts = [{ id: 'a', code: 'SAVE', percent: 20, type: 'dateRange', validFrom: '2099-06-10', validTo: '2099-06-01' }]
  await assert.rejects(contentRepository.save(content), /Invalid or duplicate discount/)
})

test('email API validates dates and sends escaped, idempotent owner/client messages using saved recipient', async () => {
  const keys = ['VERCEL', 'RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'ALLOWED_ORIGIN', 'SUPABASE_URL', 'SUPABASE_ANON_KEY']
  const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]))
  const originalFetch = globalThis.fetch
  const sent = []
  try {
    Object.assign(process.env, { VERCEL: '1', RESEND_API_KEY: 're_test_key', RESEND_FROM_EMAIL: 'Gerka Pool House <rezerwacje@gerkapoolhouse.pl>',
      ALLOWED_ORIGIN: 'https://test.example.com', SUPABASE_URL: 'https://settings.example.com', SUPABASE_ANON_KEY: 'test-key' })
    const { default: handler } = await import('../api/reservation-email.ts')
    globalThis.fetch = async (url, options) => {
      const address = String(url)
      if (address.includes('/rest/v1/site_content')) return new Response(JSON.stringify([{ content: { booking: { ownerEmail: 'gerkapoolhouse@gmail.com' } } }]))
      assert.ok(address.startsWith('https://api.resend.com/'))
      sent.push({ body: JSON.parse(options.body), headers: Object.fromEntries(new Headers(options.headers)) })
      return new Response(JSON.stringify({ id: `mail-${sent.length}` }), { headers: { 'Content-Type': 'application/json' } })
    }
    const body = { reservationNumber: 'GPH-20990615-TEST', ownerEmail: 'payload-owner@example.com', clientEmail: 'guest@example.com',
      ownerSubject: 'Inquiry', clientSubject: 'Confirmation', clientBody: 'Thank you', propertyName: 'Test house', currency: 'PLN', locale: 'en',
      request: { reservationNumber: 'GPH-20990615-TEST', fullName: '<script>test</script>', email: 'guest@example.com', phone: '123456789',
        guests: 2, checkIn: '2099-06-15', checkOut: '2099-06-17', nights: 2, apartment: 'both', roomsUsed: 2, nightlyPrice: 2500, estimatedTotal: 1000, message: '<img src=x onerror=bad>' } }
    const call = async (payload, method = 'POST') => {
      let result
      const response = { setHeader() {}, status(status) { return { json(data) { result = { status, data } }, end() { result = { status } } } } }
      await handler({ method, headers: { origin: 'https://test.example.com', 'x-forwarded-for': '127.0.0.55' }, body: payload }, response)
      return result
    }
    assert.equal((await call(body)).status, 200)
    assert.equal(sent.length, 2)
    assert.equal(sent[0].body.to, 'gerkapoolhouse@gmail.com')
    assert.equal(sent[1].body.to, 'guest@example.com')
    assert.equal(sent[0].body.from, 'Gerka Pool House <rezerwacje@gerkapoolhouse.pl>')
    assert.equal(sent[1].body.from, 'Gerka Pool House <rezerwacje@gerkapoolhouse.pl>')
    assert.equal(sent[0].body.reply_to, 'guest@example.com')
    assert.equal(sent[1].body.reply_to, 'gerkapoolhouse@gmail.com')
    assert.equal(sent[0].headers['idempotency-key'], 'owner-GPH-20990615-TEST')
    assert.ok(!sent[0].body.html.includes('<script>'))
    assert.ok(sent[0].body.html.includes('&lt;script&gt;'))
    assert.ok(sent[0].body.html.includes('before discount'))
    assert.equal((await call({ ...body, request: { ...body.request, nights: 3 } })).status, 400)
    assert.equal((await call({ ...body, request: { ...body.request, checkIn: '2099-02-31' } })).status, 400)
    assert.equal((await call(body, 'GET')).status, 405)
    assert.equal(sent.length, 2)
  } finally {
    globalThis.fetch = originalFetch
    for (const key of keys) { if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key] }
  }
})


test('booking today and tomorrow follow the property time zone rather than a visitor clock', async () => {
  const { getTodayISO, getTomorrowISO } = await import('../src/utils/date.ts')
  const OriginalDate = globalThis.Date
  globalThis.Date = class extends OriginalDate {
    constructor(...args) { if (args.length) super(...args); else super('2026-10-13T22:30:00Z') }
  }
  try {
    assert.equal(getTodayISO(), '2026-10-14')
    assert.equal(getTomorrowISO(), '2026-10-15')
  } finally { globalThis.Date = OriginalDate }
})


test('upstairs descriptions migrate without losing edits and render independently in both languages', async () => {
  const { defaultSiteContent } = await import('../src/constants/defaultContent.ts')
  const { contentRepository } = await import('../src/services/contentRepository.ts')
  const { resolveSiteContent } = await import('../src/utils/contentTemplates.ts')
  const { AboutSection } = await import('../src/sections/AboutSection.tsx')
  const { default: React } = await import('react')
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { default: i18n } = await import('i18next')
  const legacy = structuredClone(defaultSiteContent)
  legacy.version = 28
  delete legacy.about.upperBody
  for (const locale of ['pl', 'en']) {
    legacy.about.body[locale] = `#### Ground ${locale}\nGround edited ${locale}\n\n#### Upstairs ${locale}\nUpper edited ${locale} {{capacityUpper}}\n\n* Feature ${locale}\n\nUpper ending ${locale}`
  }
  const originalWindow = globalThis.window
  const storage = new Map([['gerka-pool-house:site-content:v1', JSON.stringify(legacy)]])
  globalThis.window = { localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  } }
  try {
    const loaded = contentRepository.loadLocal()
    assert.equal(loaded.version, defaultSiteContent.version)
    for (const locale of ['pl', 'en']) {
      assert.equal(loaded.about.body[locale], `#### Ground ${locale}\nGround edited ${locale}`)
      assert.match(loaded.about.upperBody[locale], new RegExp(`Upper ending ${locale}`))
      loaded.about.upperBody[locale] = `Upper independently edited ${locale} {{capacityUpper}}`
    }
    contentRepository.saveLocal(loaded)
    const reloaded = contentRepository.loadLocal()
    assert.deepEqual(reloaded.about.upperBody, loaded.about.upperBody)
    reloaded.pricing.room2Enabled = true
    reloaded.pricing.room1Capacity = 6
    reloaded.pricing.maxGuests = 14
    for (const locale of ['pl', 'en']) {
      await i18n.changeLanguage(locale)
      // Both cards must still render if the owner removes the Markdown heading.
      reloaded.about.body[locale] = `Ground plain text ${locale}`
      const render = () => renderToStaticMarkup(React.createElement(AboutSection, { content: resolveSiteContent(reloaded), locale }))
      const enabled = render()
      assert.ok(enabled.includes(`Ground plain text ${locale}`))
      assert.ok(enabled.includes(`Upper independently edited ${locale} 8`))
      assert.ok(!enabled.includes(`Upper independently edited ${locale === 'pl' ? 'en' : 'pl'}`))
      reloaded.pricing.room2Enabled = false
      assert.ok(!render().includes(`Upper independently edited ${locale}`))
      reloaded.pricing.room2Enabled = true
    }
  } finally { globalThis.window = originalWindow }
})

test('patched image library supports the server resizing and compositing pipeline', async () => {
  const { default: sharp } = await import('sharp')
  const source = await sharp({ create: { width: 240, height: 120, channels: 3, background: '#112233' } }).png().toBuffer()
  const overlay = Buffer.from('<svg width="1200" height="630"><rect width="40" height="40" fill="white"/></svg>')
  const output = await sharp(source).rotate().resize(1200, 630, { fit: 'cover', position: 'center' })
    .composite([{ input: overlay, left: 0, top: 0 }]).jpeg({ quality: 92, chromaSubsampling: '4:4:4' }).toBuffer()
  const info = await sharp(output).metadata()
  assert.equal(info.width, 1200)
  assert.equal(info.height, 630)
  assert.equal(info.format, 'jpeg')
})
