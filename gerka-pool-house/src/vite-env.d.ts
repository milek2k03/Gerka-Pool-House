/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string
  readonly VITE_GA_MEASUREMENT_ID?: string
  readonly VITE_GTM_ID?: string
  readonly VITE_GOOGLE_SITE_VERIFICATION?: string
  readonly VITE_RESERVATION_EMAIL_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
