import { env } from '@/config/env'
import type { StoreSettings } from '@/types'
import { apiGet, apiPut } from './http'
import { mockApi } from './mockClient'

export async function getSettings(): Promise<StoreSettings> {
  if (env.useMockData) return mockApi.settings()
  return apiGet<StoreSettings>('/api/admin/settings')
}

export async function updateSettings(payload: Partial<StoreSettings>): Promise<StoreSettings> {
  if (env.useMockData) return mockApi.updateSettings(payload)
  return apiPut<StoreSettings>('/api/admin/settings', payload)
}

export async function resetDemoData(): Promise<{ success: boolean }> {
  if (env.useMockData) return mockApi.reset()
  return { success: false }
}
