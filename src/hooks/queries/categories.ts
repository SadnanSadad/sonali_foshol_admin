import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/config/queryKeys'
import { getCategories } from '@/api/category.api'

export function useCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: getCategories,
    staleTime: 5 * 60_000,
  })
}
