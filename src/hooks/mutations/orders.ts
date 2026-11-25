import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from '@/i18n'
import { updateOrderStatus, type UpdateOrderStatusPayload } from '@/api/order.api'
import { queryKeys } from '@/config/queryKeys'
import type { Order } from '@/types'

type OrderStatusVariables = UpdateOrderStatusPayload & { id: string }

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: OrderStatusVariables) => updateOrderStatus(id, payload),
    onMutate: async (variables) => {
      const detailKey = queryKeys.orders.detail(variables.id)
      await queryClient.cancelQueries({ queryKey: detailKey })
      const previous = queryClient.getQueryData<Order>(detailKey)
      if (previous) {
        queryClient.setQueryData<Order>(detailKey, { ...previous, status: variables.status })
      }
      return { previous, detailKey }
    },
    onSuccess: () => {
      toast.success(i18n.t('orderDetails.statusUpdated'))
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.detailKey, context.previous)
      }
      toast.error(error.message)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      void queryClient.invalidateQueries({ queryKey: ['order'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      void queryClient.invalidateQueries({ queryKey: ['customers'] })
      void queryClient.invalidateQueries({ queryKey: ['calendar'] })
    },
  })
}
