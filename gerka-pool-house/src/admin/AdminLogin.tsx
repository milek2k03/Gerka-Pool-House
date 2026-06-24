import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Logo } from '../components/common/Logo'
import { Seo } from '../components/common/Seo'
import { Button } from '../components/ui/Button'
import { useSiteContent } from '../hooks/useSiteContent'
import { getLocale } from '../utils/locale'

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

type AdminLoginValues = z.infer<typeof adminLoginSchema>

interface AdminLoginProps {
  isConfigured: boolean
  onSignIn: (email: string, password: string) => Promise<void>
}

export function AdminLogin({ isConfigured, onSignIn }: AdminLoginProps) {
  const { t, i18n } = useTranslation()
  const locale = getLocale(i18n.language)
  const { content } = useSiteContent()
  const [authError, setAuthError] = useState('')
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<AdminLoginValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const submit = handleSubmit(async (values) => {
    setAuthError('')

    try {
      await onSignIn(values.email, values.password)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : t('admin.auth.loginFailed'))
    }
  })

  return (
    <>
      <Seo settings={content.seo.admin} locale={locale} noindex />
      <main className="grid min-h-screen bg-[var(--color-paper)] px-5 py-8">
        <div className="mx-auto grid w-full max-w-xl content-center gap-7">
          <Logo />

          <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)] sm:p-8">
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brass)]">
                {content.brandName}
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-[var(--color-ink)]">{t('admin.auth.title')}</h1>
              <p className="mt-3 max-w-md text-base leading-7 text-[var(--color-muted)]">{t('admin.auth.subtitle')}</p>
            </div>

            {!isConfigured ? (
              <div className="rounded-[1.1rem] border border-amber-300/25 bg-amber-950/25 p-4 text-sm leading-6 text-amber-100">
                <p className="font-semibold">{t('admin.auth.notConfiguredTitle')}</p>
                <p className="mt-2">{t('admin.auth.notConfiguredBody')}</p>
              </div>
            ) : (
              <form className="grid gap-5" onSubmit={submit}>
                <label className="grid gap-2 text-sm font-semibold text-[var(--color-ink)]">
                  {t('admin.auth.email')}
                  <span className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-lg bg-[rgba(214,181,138,0.14)] text-[var(--color-brass)]">
                      <Mail aria-hidden="true" className="size-4" />
                    </span>
                    <input
                      className="field admin-login-input"
                      type="email"
                      autoComplete="email"
                      placeholder={t('admin.auth.emailPlaceholder')}
                      {...register('email')}
                    />
                  </span>
                  {errors.email ? <span className="text-xs text-red-200">{t('validation.email')}</span> : null}
                </label>

                <label className="grid gap-2 text-sm font-semibold text-[var(--color-ink)]">
                  {t('admin.auth.password')}
                  <span className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-lg bg-[rgba(214,181,138,0.14)] text-[var(--color-brass)]">
                      <Lock aria-hidden="true" className="size-4" />
                    </span>
                    <input
                      className="field admin-login-input"
                      type="password"
                      autoComplete="current-password"
                      placeholder={t('admin.auth.passwordPlaceholder')}
                      {...register('password')}
                    />
                  </span>
                  {errors.password ? <span className="text-xs text-red-200">{t('admin.auth.passwordError')}</span> : null}
                </label>

                {authError ? (
                  <p className="rounded-[1rem] border border-red-400/25 bg-red-950/35 p-3 text-sm text-red-100">
                    {authError}
                  </p>
                ) : null}

                <Button type="submit" size="lg" className="mt-1 w-full text-base" disabled={isSubmitting}>
                  {isSubmitting ? t('admin.auth.signingIn') : t('admin.auth.signIn')}
                </Button>
              </form>
            )}
          </section>
        </div>
      </main>
    </>
  )
}
