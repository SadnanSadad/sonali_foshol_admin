import { env } from '@/config/env'
import type { Order, OrderFilters, OrderStatus, Paginated } from '@/types'
import { apiGet, apiGetList, apiPatch } from './http'
import { mockApi } from './mockClient'

export interface UpdateOrderStatusPayload {
  status: OrderStatus
  reason?: string
  feedback?: string
  courier?: string
  trackingId?: string
}

export async function getOrders(filters: OrderFilters): Promise<Paginated<Order>> {
  if (env.useMockData) return mockApi.orders(filters)
  return apiGetList<Order>('/api/admin/orders', { ...filters })
}

export async function getOrder(id: string): Promise<Order> {
  if (env.useMockData) return mockApi.order(id)
  return apiGet<Order>(`/api/admin/orders/${id}`)
}

export async function updateOrderStatus(
  id: string,
  payload: UpdateOrderStatusPayload,
): Promise<Order> {
  if (env.useMockData) return mockApi.updateOrderStatus(id, payload)
  return apiPatch<Order>(`/api/admin/orders/${id}/status`, payload)
}
