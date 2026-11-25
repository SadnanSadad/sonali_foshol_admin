import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/config/queryKeys'
import { getCalendarEvents } from '@/api/calendar.api'

export function useCalendarEventsQuery(from: string, to: string) {
  return useQuery({
    queryKey: queryKeys.calendar.events(from, to),
    queryFn: () => getCalendarEvents(from, to),
    enabled: Boolean(from && to),
    staleTime: 30_000,
  })
}
