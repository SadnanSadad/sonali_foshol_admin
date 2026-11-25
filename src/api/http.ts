import type { ApiEnvelope, Paginated, PaginationMeta } from '@/types'
import { axiosInstance } from './axiosInstance'

export function cleanParams<T extends Record<string, unknown>>(params: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== '' && value !== 'all',
    ),
  )
}

function fallbackMeta(length: number): PaginationMeta {
  return { page: 1, limit: length, total: length, totalPages: 1 }
}

export async function apiGetList<T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<Paginated<T>> {
  const { data } = await axiosInstance.get<ApiEnvelope<T[]>>(url, {
    params: params ? cleanParams(params) : undefined,
  })
  return { items: data.data, meta: data.meta ?? fallbackMeta(data.data.length) }
}

export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await axiosInstance.get<ApiEnvelope<T>>(url, {
    params: params ? cleanParams(params) : undefined,
  })
  return data.data
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await axiosInstance.post<ApiEnvelope<T>>(url, body)
  return data.data
}

export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await axiosInstance.put<ApiEnvelope<T>>(url, body)
  return data.data
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await axiosInstance.patch<ApiEnvelope<T>>(url, body)
  return data.data
}

export async function apiDelete<T>(url: string): Promise<T> {
  const { data } = await axiosInstance.delete<ApiEnvelope<T>>(url)
  return data.data
}
