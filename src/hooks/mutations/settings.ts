import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from '@/i18n'
import { resetDemoData, updateSettings } from '@/api/settings.api'
import type { StoreSettings } from '@/types'

export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<StoreSettings>) => updateSettings(payload),
    onSuccess: () => {
      toast.success(i18n.t('settings.saved'))
      void queryClient.invalidateQueries({ queryKey: ['settings'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useResetDemoDataMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: resetDemoData,
    onSuccess: () => {
      toast.success(i18n.t('settings.resetDone'))
      queryClient.clear()
    },
    onError: (error: Error) => toast.error(error.message),
  })
}
