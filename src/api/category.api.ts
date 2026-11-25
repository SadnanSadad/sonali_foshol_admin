import { env } from '@/config/env'
import type { Category } from '@/types'
import { apiDelete, apiGet, apiPost, apiPut } from './http'
import { mockApi } from './mockClient'

export async function getCategories(): Promise<Category[]> {
  if (env.useMockData) return mockApi.categories()
  return apiGet<Category[]>('/api/admin/categories')
}

export async function createCategory(
  payload: Omit<Category, 'id' | 'order'>,
): Promise<Category> {
  if (env.useMockData) return mockApi.createCategory(payload)
  return apiPost<Category>('/api/admin/categories', payload)
}

export async function updateCategory(
  id: string,
  payload: Partial<Category>,
): Promise<Category> {
  if (env.useMockData) return mockApi.updateCategory(id, payload)
  return apiPut<Category>(`/api/admin/categories/${id}`, payload)
}

export async function deleteCategory(id: string): Promise<{ success: boolean }> {
  if (env.useMockData) return mockApi.deleteCategory(id)
  return apiDelete<{ success: boolean }>(`/api/admin/categories/${id}`)
}
