import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/config/queryKeys'
import { getProduct, getProductBySlug, getProducts } from '@/api/product.api'
import type { ProductFilters } from '@/types'

export function useProductsQuery(filters: ProductFilters) {
  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: () => getProducts(filters),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  })
}

export function useProductQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.products.detail(id ?? ''),
    queryFn: () => getProduct(id!),
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
  })
}

export function useProductBySlugQuery(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.products.slug(slug ?? ''),
    queryFn: () => getProductBySlug(slug!),
    enabled: Boolean(slug),
    staleTime: 5 * 60_000,
  })
}
