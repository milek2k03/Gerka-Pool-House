import './load-typescript.mjs'
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import { mkdir } from 'node:fs/promises'
const { defaultSiteContent } = await import('../src/constants/defaultContent.ts')
const { pl } = await import('../src/locales/pl/translation.ts')
const { en } = await import('../src/locales/en/translation.ts')

const modulePath = process.env.PLAYWRIGHT_MODULE_PATH
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright-core')
const origin = process.env.BROWSER_TEST_ORIGIN ?? 'http://127.0.0.1:4173'
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
let content = structuredClone(defaultSiteContent)
content.contact.email = 'contact@example.com'
content.booking.ownerEmail = 'owner@example.com'
content.contact.mapEmbedUrl = ''
function fixAssets(value) {
  if (!value || typeof value !== 'object') return
  if (value.src) { value.src = '/newBackground.webp'; delete value.webp; delete value.avif }
  Object.values(value).forEach(fixAssets)
}
fixAssets(content)
let stamp = content.updatedAt
const reservations = []
let delivered = 0
let adminAllowed = true
const errors = []
const user = { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'admin@example.com' }
const jwt = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: user.id, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.test`
await context.routeWebSocket('wss://test-project.supabase.co/**', (socket) => {
  socket.onMessage((text) => {
    try {
      const [joinRef, ref, topic, event] = JSON.parse(text)
      if (event === 'phx_join' || event === 'heartbeat') socket.send(JSON.stringify([joinRef, ref, topic, 'phx_reply', { status: 'ok', response: { postgres_changes: [] } }]))
    } catch { /* No external websocket is opened in this isolated test. */ }
  })
})
await context.route('**/*', async (route) => {
  const request = route.request()
  const url = new URL(request.url())
  const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
  if (url.hostname === 'test-project.supabase.co') {
    if (url.pathname.startsWith('/auth/v1/token')) return reply({ access_token: jwt, refresh_token: 'test-refresh', expires_in: 3600, token_type: 'bearer', user })
    if (url.pathname.startsWith('/auth/v1/user')) return reply(user)
    if (url.pathname.startsWith('/auth/v1/logout')) return reply({})
    if (url.pathname === '/rest/v1/rpc/is_admin') return reply(adminAllowed)
    if (url.pathname === '/rest/v1/site_content') {
      if (request.method() === 'PATCH') {
        if (url.searchParams.get('updated_at') !== `eq.${stamp}`) return reply([])
        const body = request.postDataJSON(); content = body.content; stamp = body.updated_at
        return reply(request.headers().accept?.includes('object') ? { id: 'main' } : [{ id: 'main' }])
      }
      return reply([{ content, updated_at: stamp }])
    }
    if (url.pathname === '/rest/v1/reservation_requests') {
      if (request.method() === 'POST') { reservations.push(request.postDataJSON()); return route.fulfill({ status: 201, body: '' }) }
      if (request.method() === 'PATCH') {
        const id = url.searchParams.get('id')?.slice(3)
        const item = reservations.find((row) => row.id === id)
        if (item) Object.assign(item, request.postDataJSON())
        return reply([])
      }
      return reply(url.searchParams.has('status') ? reservations.filter((row) => row.status === 'accepted') : reservations)
    }
    return reply({})
  }
  if (url.pathname === '/api/reservation-email') { delivered++; return reply({ ok: true }) }
  if (url.origin === origin || url.protocol === 'data:') return route.continue()
  return route.fulfill({ status: 200, body: '' })
})
function capture(page) { page.on('pageerror', (error) => errors.push(error.message)) }
try {
  const page = await context.newPage(); capture(page)
  await page.goto(origin)
  await page.locator('#booking form').waitFor()
  assert.equal(await page.locator('#booking select[name=apartment] option').count(), 3)
  await page.locator('#booking select[name=apartment]').selectOption('both')
  await page.locator('#booking input[name=checkIn]').fill('2099-06-15')
  await page.locator('#booking input[name=checkOut]').fill('2099-06-17')
  await page.locator('#booking input[name=guests]').fill('2')
  await page.locator('#booking input[name=fullName]').fill('Browser Test')
  await page.locator('#booking input[name=email]').fill('guest@example.com')
  await page.locator('#booking input[name=phone]').fill('123456789')
  await page.locator('#booking input[name=privacyConsent]').check()
  await page.locator('#booking button[type=submit]').click()
  await page.getByText(pl.booking.success, { exact: true }).waitFor()
  assert.equal(reservations.length, 1)
  assert.equal(reservations[0].apartment, 'both')
  assert.equal(reservations[0].estimated_total, 1000)
  assert.ok(reservations[0].message.includes('WEEKSAVE'))
  assert.equal(delivered, 1)
  await mkdir('tmp', { recursive: true })
  // A stale form must not silently submit a newly increased rate.
  await page.locator('#booking select[name=apartment]').selectOption('ground')
  await page.locator('#booking input[name=checkIn]').fill('2099-06-12')
  await page.locator('#booking input[name=checkOut]').fill('2099-06-14')
  await page.locator('#booking input[name=fullName]').fill('Changed Rate Test')
  await page.locator('#booking input[name=email]').fill('guest@example.com')
  await page.locator('#booking input[name=phone]').fill('123456789')
  await page.locator('#booking input[name=privacyConsent]').check()
  content.pricing.room1Nightly = 1200
  stamp = new Date(Date.parse(stamp) + 1).toISOString(); content.updatedAt = stamp
  await page.locator('#booking button[type=submit]').click()
  await page.getByText(pl.booking.settingsChanged, { exact: true }).waitFor()
  assert.equal(reservations.length, 1)
  await page.locator('#booking button[type=submit]').click()
  await page.getByText(pl.booking.success, { exact: true }).waitFor()
  assert.equal(reservations.length, 2)
  assert.equal(reservations[1].estimated_total, 2400)
  await page.screenshot({ path: 'tmp/audit-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false)
  await page.screenshot({ path: 'tmp/audit-mobile.png', fullPage: true })
  await page.locator('#gallery button').first().click()
  await page.getByRole('dialog').waitFor()
  await page.getByRole('button', { name: pl.common.close, exact: true }).click()
  assert.equal(await page.getByRole('dialog').count(), 0)
  await page.goto(`${origin}/?lng=en`)
  await page.locator('#booking form').waitFor()
  await page.getByRole('heading', { name: en.sections.pricingTitle, exact: true }).waitFor()
  assert.equal(await page.locator('html').getAttribute('lang'), 'en')

  const admin = await context.newPage(); capture(admin)
  await admin.goto(`${origin}/admin`)
  await admin.locator('input[name=email]').fill('admin@example.com')
  await admin.locator('input[name=password]').fill('test-password')
  await admin.locator('button[type=submit]').click()
  await admin.getByRole('button', { name: pl.admin.saveChanges, exact: true }).waitFor()
  await admin.getByRole('button', { name: pl.admin.tabs.pricing, exact: true }).click()
  await admin.getByLabel(pl.admin.fields.checkOutTime, { exact: true }).fill('10:30')
  await admin.getByLabel(pl.admin.fields.room1Price, { exact: true }).fill('1450.50')
  await admin.getByRole('button', { name: pl.admin.saveChanges, exact: true }).click()
  await admin.getByText(pl.admin.allChangesSaved, { exact: true }).waitFor()
  assert.equal(content.pricing.checkOutTime, '10:30')
  assert.equal(content.pricing.room1Nightly, 1450.5)
  await page.reload(); await page.locator('#pricing').waitFor()
  await page.getByText(/check-out.*10:30/i).first().waitFor()

  const second = await context.newPage(); capture(second)
  await second.goto(`${origin}/admin`)
  await second.getByRole('button', { name: pl.admin.tabs.pricing, exact: true }).click()
  await second.getByLabel(pl.admin.fields.room1Price, { exact: true }).fill('1550')
  await admin.getByLabel(pl.admin.fields.room1Price, { exact: true }).fill('1650')
  await admin.getByRole('button', { name: pl.admin.saveChanges, exact: true }).click()
  await admin.getByText(pl.admin.allChangesSaved, { exact: true }).waitFor()
  await second.getByRole('button', { name: pl.admin.saveChanges, exact: true }).click()
  await second.getByText(pl.admin.contentSaveConflict, { exact: true }).waitFor()
  assert.equal(content.pricing.room1Nightly, 1650)
  assert.equal(await second.getByLabel(pl.admin.fields.room1Price, { exact: true }).inputValue(), '1550')
  await admin.getByRole('button', { name: pl.admin.tabs.availability, exact: true }).click()
  assert.equal(await admin.getByRole('heading', { name: pl.booking.groundApartment, exact: true }).count(), 1)
  assert.equal(await admin.getByRole('heading', { name: pl.booking.upperApartment, exact: true }).count(), 1)
  await admin.getByRole('button', { name: pl.admin.fields.addAvailabilityRange, exact: true }).click()
  await admin.locator('section select').first().selectOption('upper')
  await admin.getByRole('button', { name: pl.admin.fields.confirmAddAvailabilityRange, exact: true }).click()
  await admin.getByRole('button', { name: pl.admin.saveChanges, exact: true }).click()
  await admin.getByText(pl.admin.allChangesSaved, { exact: true }).waitFor()
  assert.equal(content.availability.at(-1).apartment, 'upper')
  await admin.screenshot({ path: 'tmp/audit-admin.png', fullPage: true })
  const advance = () => { stamp = new Date(Date.parse(stamp) + 1).toISOString(); content.updatedAt = stamp }
  content.hero.mobileUsesDesktop = true
  content.hero.image = { src: '/newBackground.webp', webp: '/broken-fixture.webp' }; advance()
  await context.route('**/broken-fixture.webp', (route) => route.fulfill({ status: 404, body: '' }))
  await page.reload(); await page.locator('#booking form').waitFor()
  await page.locator('.hero-image-img').waitFor({ state: 'hidden' })
  content.hero.image.webp = '/newBackground.webp'; advance()
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await page.locator('.hero-image-img').waitFor({ state: 'visible' })
  assert.equal(await page.evaluate(() => document.querySelector('.hero-image-img').naturalWidth > 0), true)
  await admin.getByRole('button', { name: pl.admin.auth.signOut, exact: true }).click()
  await admin.locator('input[name=password]').waitFor()
  adminAllowed = false
  await admin.locator('input[name=email]').fill('guest@example.com')
  await admin.locator('input[name=password]').fill('test-password')
  await admin.locator('button[type=submit]').click()
  await admin.getByText('Administrator access required', { exact: true }).waitFor()
  assert.equal(await admin.getByRole('button', { name: pl.admin.saveChanges, exact: true }).count(), 0)
  assert.deepEqual(errors, [])
  console.log('Browser checks passed: booking both, promotional price, email payload, PL/EN, mobile overflow, admin login, save, stale editor protection, separate calendars and manual block.')
} finally {
  await context.close(); await browser.close()
}
