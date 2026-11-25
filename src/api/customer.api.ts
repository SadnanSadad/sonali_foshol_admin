import { env } from '@/config/env'
import type { Customer, CustomerFilters, Order, Paginated } from '@/types'
import { apiGet, apiGetList, apiPatch } from './http'
import { mockApi } from './mockClient'

export async function getCustomers(filters: CustomerFilters): Promise<Paginated<Customer>> {
  if (env.useMockData) return mockApi.customers(filters)
  return apiGetList<Customer>('/api/admin/customers', { ...filters })
}

export async function getCustomer(id: string): Promise<Customer> {
  if (env.useMockData) return mockApi.customer(id)
  return apiGet<Customer>(`/api/admin/customers/${id}`)
}

export async function getCustomerOrders(id: string): Promise<Order[]> {
  if (env.useMockData) return mockApi.customerOrders(id)
  const result = await apiGetList<Order>(`/api/admin/customers/${id}/orders`, { limit: 100 })
  return result.items
}

export async function flagCustomer(id: string, flagged: boolean): Promise<Customer> {
  if (env.useMockData) return mockApi.flagCustomer(id, flagged)
  return apiPatch<Customer>(`/api/admin/customers/${id}/flag`, { flagged })
}
