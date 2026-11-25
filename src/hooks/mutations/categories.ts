import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from '@/api/category.api'
import type { Category } from '@/types'

function invalidateCategories(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['categories'] })
  void queryClient.invalidateQueries({ queryKey: ['products'] })
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Omit<Category, 'id' | 'order'>) => createCategory(payload),
    onSuccess: () => invalidateCategories(queryClient),
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Category> }) =>
      updateCategory(id, payload),
    onSuccess: () => invalidateCategories(queryClient),
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => invalidateCategories(queryClient),
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useReorderCategoriesMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (categories: Category[]) => {
      await Promise.all(
        categories.map((category, index) =>
          updateCategory(category.id, { order: index + 1 }),
        ),
      )
    },
    onSuccess: () => invalidateCategories(queryClient),
    onError: (error: Error) => toast.error(error.message),
  })
}
