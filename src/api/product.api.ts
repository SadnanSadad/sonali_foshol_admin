import { env } from '@/config/env'
import type { AdminProduct, Paginated, ProductFilters } from '@/types'
import { axiosInstance } from './axiosInstance'
import { apiDelete, apiGet, apiGetList, apiPatch, apiPost, apiPut } from './http'
import { mockApi } from './mockClient'

export async function getProducts(filters: ProductFilters): Promise<Paginated<AdminProduct>> {
  if (env.useMockData) return mockApi.products(filters)
  return apiGetList<AdminProduct>('/api/admin/products', { ...filters })
}

export async function getProduct(id: string): Promise<AdminProduct> {
  if (env.useMockData) return mockApi.product(id)
  return apiGet<AdminProduct>(`/api/admin/products/${id}`)
}

export async function getProductBySlug(slug: string): Promise<AdminProduct | null> {
  if (env.useMockData) return mockApi.productBySlug(slug)
  const result = await apiGetList<AdminProduct>('/api/admin/products', { search: slug, limit: 100 })
  return result.items.find((product) => product.slug === slug) ?? null
}

export async function createProduct(
  payload: Omit<AdminProduct, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<AdminProduct> {
  if (env.useMockData) return mockApi.createProduct(payload)
  return apiPost<AdminProduct>('/api/admin/products', payload)
}

export async function updateProduct(
  id: string,
  payload: Partial<AdminProduct>,
): Promise<AdminProduct> {
  if (env.useMockData) return mockApi.updateProduct(id, payload)
  return apiPut<AdminProduct>(`/api/admin/products/${id}`, payload)
}

export async function deleteProduct(id: string): Promise<{ success: boolean }> {
  if (env.useMockData) return mockApi.deleteProduct(id)
  return apiDelete<{ success: boolean }>(`/api/admin/products/${id}`)
}

export async function bulkProducts(
  action: 'publish' | 'unpublish' | 'delete',
  ids: string[],
): Promise<{ count: number }> {
  if (env.useMockData) return mockApi.bulkProducts(action, ids)
  return apiPatch<{ count: number }>('/api/admin/products/bulk', { action, ids })
}

export async function uploadImage(file: File): Promise<{ url: string }> {
  if (env.useMockData) return mockApi.uploadImage(file)
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await axiosInstance.post<{ success: boolean; data: { url: string } }>(
    '/api/admin/uploads',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data.data
}
