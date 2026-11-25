import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from '@/i18n'
import { deleteReview, updateReview } from '@/api/review.api'
import type { Paginated, Review, ReviewStatus } from '@/types'

export function useUpdateReviewMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReviewStatus }) => updateReview(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['reviews'] })
      const snapshots = queryClient.getQueriesData<Paginated<Review>>({ queryKey: ['reviews'] })
      queryClient.setQueriesData<Paginated<Review>>({ queryKey: ['reviews'] }, (current) => {
        if (!current) return current
        return {
          ...current,
          items: current.items.map((review) => (review.id === id ? { ...review, status } : review)),
        }
      })
      return { snapshots }
    },
    onSuccess: () => {
      toast.success(i18n.t('reviews.statusUpdated'))
    },
    onError: (error: Error, _variables, context) => {
      context?.snapshots.forEach(([key, value]) => queryClient.setQueryData(key, value))
      toast.error(error.message)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}

export function useDeleteReviewMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      toast.success(i18n.t('reviews.deleted'))
      void queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })
}
