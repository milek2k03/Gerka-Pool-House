const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID
const gtmId = import.meta.env.VITE_GTM_ID

function loadScript(src: string, id: string) {
  if (document.getElementById(id)) return

  const script = document.createElement('script')
  script.id = id
  script.async = true
  script.src = src
  document.head.appendChild(script)
}

export function initAnalytics() {
  if (gtmId) {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js',
    })
    loadScript(`https://www.googletagmanager.com/gtm.js?id=${gtmId}`, 'gtm-loader')
    return
  }

  if (gaMeasurementId) {
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`, 'ga4-loader')

    window.dataLayer = window.dataLayer || []
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args)
    }
    gtag('js', new Date())
    gtag('config', gaMeasurementId, { anonymize_ip: true })
  }
}

declare global {
  interface Window {
    dataLayer: unknown[]
  }
}
