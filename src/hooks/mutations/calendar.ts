import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from '@/i18n'
import {
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
} from '@/api/calendar.api'
import type { CalendarEvent } from '@/types'

function invalidateCalendar(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['calendar'] })
  void queryClient.invalidateQueries({ queryKey: ['order'] })
  void queryClient.invalidateQueries({ queryKey: ['orders'] })
}

export function useCreateCalendarEventMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Omit<CalendarEvent, 'id' | 'type'>) => createCalendarEvent(payload),
    onSuccess: () => {
      toast.success(i18n.t('calendar.eventCreated'))
      invalidateCalendar(queryClient)
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useUpdateCalendarEventMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CalendarEvent> }) =>
      updateCalendarEvent(id, payload),
    onSuccess: () => {
      toast.success(i18n.t('calendar.eventUpdated'))
      invalidateCalendar(queryClient)
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useDeleteCalendarEventMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCalendarEvent,
    onSuccess: () => {
      toast.success(i18n.t('calendar.eventDeleted'))
      invalidateCalendar(queryClient)
    },
    onError: (error: Error) => toast.error(error.message),
  })
}
