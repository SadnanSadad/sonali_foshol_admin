import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from '@/i18n'
import {
  bulkProducts,
  createProduct,
  deleteProduct,
  updateProduct,
  uploadImage,
} from '@/api/product.api'
import type { AdminProduct } from '@/types'

function invalidateProducts(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['products'] })
  void queryClient.invalidateQueries({ queryKey: ['product'] })
  void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  void queryClient.invalidateQueries({ queryKey: ['categories'] })
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Omit<AdminProduct, 'id' | 'createdAt' | 'updatedAt'>) =>
      createProduct(payload),
    onSuccess: () => {
      toast.success(i18n.t('productForm.created'))
      invalidateProducts(queryClient)
    },
  })
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AdminProduct> }) =>
      updateProduct(id, payload),
    onSuccess: () => {
      toast.success(i18n.t('productForm.updated'))
      invalidateProducts(queryClient)
    },
  })
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      toast.success(i18n.t('products.deleted'))
      invalidateProducts(queryClient)
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useBulkProductsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ action, ids }: { action: 'publish' | 'unpublish' | 'delete'; ids: string[] }) =>
      bulkProducts(action, ids),
    onSuccess: (result) => {
      toast.success(i18n.t('products.bulkDone', { count: result.count }))
      invalidateProducts(queryClient)
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useUploadImageMutation() {
  return useMutation({
    mutationFn: uploadImage,
    onError: (error: Error) => toast.error(error.message),
  })
}
