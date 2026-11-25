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

let csrfRefreshing = false

export async function ensureCsrfCookie() {
  await axios.get(`${baseUrl}/sanctum/csrf-cookie`, { withCredentials: true })
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401) {
      const { useAuthStore } = await import('@/store/auth.store')
      useAuthStore.getState().clear()
      if (window.location.pathname !== '/login') {
        const redirect = encodeURIComponent(window.location.pathname + window.location.search)
        window.location.assign(`/login?redirect=${redirect}`)
      }
      return Promise.reject(error)
    }

    if (error.response?.status === 419 && !originalRequest._retry) {
      originalRequest._retry = true
      if (!csrfRefreshing) {
        csrfRefreshing = true
        try {
          await ensureCsrfCookie()
        } finally {
          csrfRefreshing = false
        }
      }
      return axiosInstance(originalRequest)
    }

    return Promise.reject(error)
  },
)
