import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from '@/i18n'
import { flagCustomer } from '@/api/customer.api'

export function useFlagCustomerMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, flagged }: { id: string; flagged: boolean }) => flagCustomer(id, flagged),
    onSuccess: (_customer, variables) => {
      toast.success(i18n.t(variables.flagged ? 'customers.flagSuccess' : 'customers.unflagSuccess'))
      void queryClient.invalidateQueries({ queryKey: ['customers'] })
      void queryClient.invalidateQueries({ queryKey: ['customer'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })
}
