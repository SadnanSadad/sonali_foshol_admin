import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/config/queryKeys'
import { getReviews } from '@/api/review.api'
import type { ReviewFilters } from '@/types'

export function useReviewsQuery(filters: ReviewFilters) {
  return useQuery({
    queryKey: queryKeys.reviews.list(filters),
    queryFn: () => getReviews(filters),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })
}
