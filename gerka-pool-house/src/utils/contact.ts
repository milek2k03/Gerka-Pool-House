export function isMapEmbedUrl(value: string) {
  try {
    const url = new URL(value)
    const googleHost = url.hostname === 'google.com' || url.hostname.endsWith('.google.com')
    return url.protocol === 'https:' && googleHost &&
      (url.pathname.startsWith('/maps/embed') || (url.pathname === '/maps' && url.searchParams.get('output') === 'embed'))
  } catch {
    return false
  }
}
