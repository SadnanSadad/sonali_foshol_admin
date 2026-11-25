import { z } from 'zod'

const envSchema = z.object({
  VITE_USE_MOCK_DATA: z.string().optional(),
  VITE_API_BASE_URL: z.string().optional(),
  VITE_STOREFRONT_URL: z.string().optional(),
})

const parsed = envSchema.parse(import.meta.env)

export const baseUrl = parsed.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const apiUrl = `${baseUrl}/api`

export const env = {
  useMockData: parsed.VITE_USE_MOCK_DATA !== 'false',
  baseUrl,
  apiUrl,
  storefrontUrl: parsed.VITE_STOREFRONT_URL ?? 'https://sonalifoshol.com',
} as const
