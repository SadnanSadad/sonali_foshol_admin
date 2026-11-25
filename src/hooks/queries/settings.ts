import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/config/queryKeys'
import { getSettings } from '@/api/settings.api'

export function useSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: getSettings,
    staleTime: 10 * 60_000,
  })
}
