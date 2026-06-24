/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string
  readonly VITE_GA_MEASUREMENT_ID?: string
  readonly VITE_GTM_ID?: string
  readonly VITE_GOOGLE_SITE_VERIFICATION?: string
  readonly VITE_RESERVATION_EMAIL_ENDPOINT?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_SUPABASE_MEDIA_BUCKET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  __GERKA_SITE_CONTENT_PROMISE__?: Promise<unknown | null>
}
