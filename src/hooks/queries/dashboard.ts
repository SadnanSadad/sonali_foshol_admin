import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/config/queryKeys'
import {
  getDashboardSummary,
  getSales,
  getStatusBreakdown,
  getTopProducts,
} from '@/api/dashboard.api'

export function useDashboardSummaryQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: getDashboardSummary,
    staleTime: 60_000,
  })
}

export function useSalesQuery(range: string) {
  return useQuery({
    queryKey: queryKeys.dashboard.sales(range),
    queryFn: () => getSales(range),
    staleTime: 60_000,
  })
}

export function useStatusBreakdownQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.statusBreakdown,
    queryFn: getStatusBreakdown,
    staleTime: 60_000,
  })
}

export function useTopProductsQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.topProducts,
    queryFn: getTopProducts,
    staleTime: 60_000,
  })
}
