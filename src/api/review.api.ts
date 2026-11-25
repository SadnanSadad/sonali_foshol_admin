import { env } from '@/config/env'
import type { Paginated, Review, ReviewFilters, ReviewStatus } from '@/types'
import { apiDelete, apiGetList, apiPatch } from './http'
import { mockApi } from './mockClient'

export async function getReviews(filters: ReviewFilters): Promise<Paginated<Review>> {
  if (env.useMockData) return mockApi.reviews(filters)
  return apiGetList<Review>('/api/admin/reviews', { ...filters })
}

export async function updateReview(id: string, status: ReviewStatus): Promise<Review> {
  if (env.useMockData) return mockApi.updateReview(id, status)
  return apiPatch<Review>(`/api/admin/reviews/${id}`, { status })
}

export async function deleteReview(id: string): Promise<{ success: boolean }> {
  if (env.useMockData) return mockApi.deleteReview(id)
  return apiDelete<{ success: boolean }>(`/api/admin/reviews/${id}`)
}
