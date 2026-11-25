import { env } from '@/config/env'
import type { CalendarEvent } from '@/types'
import { apiDelete, apiGet, apiPost, apiPut } from './http'
import { mockApi } from './mockClient'

export async function getCalendarEvents(
  from: string,
  to: string,
): Promise<CalendarEvent[]> {
  if (env.useMockData) return mockApi.calendarEvents(from, to)
  return apiGet<CalendarEvent[]>('/api/admin/calendar/events', { from, to })
}

export async function createCalendarEvent(
  payload: Omit<CalendarEvent, 'id' | 'type'>,
): Promise<CalendarEvent> {
  if (env.useMockData) return mockApi.createCalendarEvent(payload)
  return apiPost<CalendarEvent>('/api/admin/calendar/events', payload)
}

export async function updateCalendarEvent(
  id: string,
  payload: Partial<CalendarEvent>,
): Promise<CalendarEvent> {
  if (env.useMockData) return mockApi.updateCalendarEvent(id, payload)
  return apiPut<CalendarEvent>(`/api/admin/calendar/events/${id}`, payload)
}

export async function deleteCalendarEvent(id: string): Promise<{ success: boolean }> {
  if (env.useMockData) return mockApi.deleteCalendarEvent(id)
  return apiDelete<{ success: boolean }>(`/api/admin/calendar/events/${id}`)
}
