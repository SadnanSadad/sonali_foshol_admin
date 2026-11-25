import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Eye, EyeOff, Leaf, LockKeyhole, Loader2, Mail, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { changeLanguage, type AppLanguage } from '@/i18n'
import { useLoginMutation } from '@/hooks/mutations/auth'
// import { fetchMe } from '@/api/auth.api' // unused since the post-login /me round-trip was removed
import { loginSchema, type LoginValues } from '@/schemas/settings.schema'
import { useAuthStore } from '@/store/auth.store'

export default function LoginPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  // const clear = useAuthStore((state) => state.clear) // unused since the post-login /me round-trip was removed
  const loginMutation = useLoginMutation()
  const language: AppLanguage = i18n.language === 'bn' ? 'bn' : 'en'
  const [showPassword, setShowPassword] = useState(false)
  // The "verifying session" spinner was tied to the post-login /me round-trip, which has been
  // removed. Kept here (commented out) for reference — re-enable together with that round-trip.
  // const [verifying, setVerifying] = useState(false)
  const verifying = false

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    form.setFocus('email')
  }, [form])

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const redirectParam = searchParams.get('redirect')
  const redirect = redirectParam?.startsWith('/') ? redirectParam : '/'

  const onSubmit = (values: LoginValues) => {
    loginMutation.mutate(
      { login: values.email, password: values.password, remember: false },
      {
        onSuccess: async (result) => {
          if (result.kind === 'authenticated') {
            // The extra `fetchMe()` round-trip was removed: it doubled the login latency and,
            // when it raced the session establishment, its 401 response went through the axios
            // interceptor and logged the freshly authenticated user straight back out.
            // The login response already carries the user, and useLoginMutation has stored it
            // in the auth store, so we can navigate immediately.
            //
            // await fetchMe()
            // setVerifying(true)
            // try {
            //   await fetchMe()
            //   navigate(redirect, { replace: true })
            // } catch {
            //   clear()
            //   toast.error(t('auth.invalid'))
            //   form.setError('root', { message: t('auth.invalid') })
            // } finally {
            //   setVerifying(false)
            // }
            toast.success(t('auth.welcome', { name: result.user.name }))
            navigate(redirect, { replace: true })
          } else {
            toast.info('Two-factor authentication is required')
          }
        },
        onError: (error: Error) => {
          toast.error(error.message || t('auth.invalid'))
          form.setError('root', { message: error.message || t('auth.invalid') })
        },
      },
    )
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-sidebar-active text-sidebar-primary-foreground">
            <Leaf className="size-6" />
          </span>
          <div>
            <p className="text-lg font-semibold leading-tight">সোনালী ফসল অর্গানিকস</p>
            <p className="text-xs text-sidebar-foreground/60">Admin Panel</p>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="font-serif text-4xl font-semibold leading-tight">
            {t('auth.brandTagline')}
          </h1>
          <p className="mt-4 text-sm text-sidebar-foreground/70">
            Products, orders, deliveries and customers — one calm workspace for the whole store.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-sidebar-foreground/80">
            <li className="flex items-center gap-2">
              <Sparkles className="size-4 text-sidebar-active" />
              Mock JSON data ready, REST API ready
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="size-4 text-sidebar-active" />
              Orders, calendar and low-stock alerts
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="size-4 text-sidebar-active" />
              Bangla product data, bilingual interface
            </li>
          </ul>
        </div>

        <p className="text-xs text-sidebar-foreground/50">© {new Date().getFullYear()} Sonali Foshol Organics</p>
        <div className="pointer-events-none absolute -bottom-24 -right-24 size-80 rounded-full bg-sidebar-active/20 blur-2xl" />
        <div className="pointer-events-none absolute -top-20 right-10 size-56 rounded-full bg-sidebar-accent/60 blur-3xl" />
      </aside>

      <main className="flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 lg:hidden">
              <span className="flex size-9 items-center justify-center rounded-xl bg-sidebar text-sidebar-foreground">
                <Leaf className="size-5" />
              </span>
              <span className="text-sm font-semibold">সোনালী ফসল</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => changeLanguage(language === 'bn' ? 'en' : 'bn')}
            >
              {language === 'bn' ? 'English' : 'বাংলা'}
            </Button>
          </div>

          <h2 className="font-serif text-2xl font-semibold">{t('auth.title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('auth.subtitle')}</p>

          {verifying && (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <p className="text-sm">{t('auth.verifying')}</p>
            </div>
          )}

          {!verifying && (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-5 space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.email')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          {...field}
                          type="text"
                          autoComplete="username"
                          placeholder={t('auth.emailPlaceholder')}
                          className="pl-9"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.password')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          placeholder={t('auth.passwordPlaceholder')}
                          className="pl-9 pr-9"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.formState.errors.root ? (
                <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
              ) : null}
              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? t('auth.signingIn') : t('auth.signIn')}
              </Button>
            </form>
          </Form>
          )}
        </div>
      </main>
    </div>
  )
}
