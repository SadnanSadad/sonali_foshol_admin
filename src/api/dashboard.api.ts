import { env } from '@/config/env'
import type {
  DashboardSummary,
  SalesPoint,
  StatusBreakdownItem,
  TopProduct,
} from '@/types'
import { apiGet } from './http'
import { mockApi } from './mockClient'

export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (env.useMockData) return mockApi.dashboardSummary()
  return apiGet<DashboardSummary>('/api/admin/dashboard/summary')
}

export async function getSales(range: string): Promise<SalesPoint[]> {
  if (env.useMockData) return mockApi.dashboardSales(range)
  return apiGet<SalesPoint[]>('/api/admin/dashboard/sales', { range })
}

export async function getStatusBreakdown(): Promise<StatusBreakdownItem[]> {
  if (env.useMockData) return mockApi.dashboardStatusBreakdown()
  return apiGet<StatusBreakdownItem[]>('/api/admin/dashboard/status-breakdown')
}

export async function getTopProducts(): Promise<TopProduct[]> {
  if (env.useMockData) return mockApi.dashboardTopProducts()
  return apiGet<TopProduct[]>('/api/admin/dashboard/top-products')
}
