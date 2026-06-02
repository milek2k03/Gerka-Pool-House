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
  if (gaMeasurementId) {
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`, 'ga4-loader')

    window.dataLayer = window.dataLayer || []
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args)
    }
    gtag('js', new Date())
    gtag('config', gaMeasurementId, { anonymize_ip: true })
  }

  if (gtmId) {
    const scriptId = 'gtm-loader'
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script')
      script.id = scriptId
      script.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`
      document.head.appendChild(script)
    }
  }
}

declare global {
  interface Window {
    dataLayer: unknown[]
  }
}
