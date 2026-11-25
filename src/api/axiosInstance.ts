import axios from 'axios'
import { baseUrl } from '@/config/env'

export const axiosInstance = axios.create({
  baseURL: baseUrl,
  timeout: 15000,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
})

// The CSRF cookie request is shared: every caller awaits the same in-flight promise instead of
// firing its own request. Previously each login/logout triggered an extra round-trip and could
// race with the login POST, which rotated the session cookie out from under it.
let csrfPromise: Promise<void> | null = null

export async function ensureCsrfCookie() {
  if (!csrfPromise) {
    csrfPromise = axiosInstance
      .get('/sanctum/csrf-cookie')
      .then(() => undefined)
      .finally(() => {
        csrfPromise = null
      })
  }
  return csrfPromise
}

// Endpoints that are legitimately allowed to answer 401 without invalidating the session.
// /api/auth/admin/me is polled during bootstrap: a 401 there means "no session yet", not
// "session expired". Treating it as a logout is what made the admin get kicked to /login
// moments after signing in.
const AUTH_PROBE_ENDPOINTS = ['/api/auth/admin/me', '/api/auth/admin/login']

function isAuthProbe(url?: string) {
  if (!url) return false
  const path = url.split('?')[0]
  return AUTH_PROBE_ENDPOINTS.some((endpoint) => path.endsWith(endpoint))
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401) {
      // A 401 from an auth probe is expected while the session is being established. Only clear
      // the store when the request was made *with* a session we believed to be valid, i.e. when we
      // are not already bootstrapping.
      const { useAuthStore } = await import('@/store/auth.store')
      const state = useAuthStore.getState()

      if (!isAuthProbe(originalRequest?.url) || state.isAuthenticated) {
        state.clear()
        if (window.location.pathname !== '/login') {
          const redirect = encodeURIComponent(window.location.pathname + window.location.search)
          window.location.assign(`/login?redirect=${redirect}`)
        }
      }
      return Promise.reject(error)
    }

    if (error.response?.status === 419 && !originalRequest._retry) {
      originalRequest._retry = true
      await ensureCsrfCookie()
      return axiosInstance(originalRequest)
    }

    return Promise.reject(error)
  },
)
