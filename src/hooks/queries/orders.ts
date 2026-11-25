import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/config/queryKeys'
import { getOrder, getOrders } from '@/api/order.api'
import type { OrderFilters } from '@/types'

export function useOrdersQuery(filters: OrderFilters) {
  return useQuery({
    queryKey: queryKeys.orders.list(filters),
    queryFn: () => getOrders(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })
}

export function useOrderQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id ?? ''),
    queryFn: () => getOrder(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  })
}
