import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/config/queryKeys'
import { getCustomer, getCustomerOrders, getCustomers } from '@/api/customer.api'
import type { CustomerFilters } from '@/types'

export function useCustomersQuery(filters: CustomerFilters) {
  return useQuery({
    queryKey: queryKeys.customers.list(filters),
    queryFn: () => getCustomers(filters),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60_000,
  })
}

export function useCustomerQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id ?? ''),
    queryFn: () => getCustomer(id!),
    enabled: Boolean(id),
    staleTime: 2 * 60_000,
  })
}

export function useCustomerOrdersQuery(id: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.customers.detail(id ?? ''), 'orders'],
    queryFn: () => getCustomerOrders(id!),
    enabled: Boolean(id),
    staleTime: 60_000,
  })
}
