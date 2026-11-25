import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns'
import { bn } from 'date-fns/locale'

function toDate(value: string | Date): Date {
  if (value instanceof Date) return value
  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : new Date(value)
}

export function formatDate(
  value: string | Date,
  pattern = 'dd MMM yyyy',
  locale: 'en' | 'bn' = 'en',
): string {
  const date = toDate(value)
  if (!isValid(date)) return '—'
  return format(date, pattern, { locale: locale === 'bn' ? bn : undefined })
}

export function formatDateTime(value: string | Date, locale: 'en' | 'bn' = 'en'): string {
  return formatDate(value, 'dd MMM yyyy, hh:mm a', locale)
}

export function formatRelative(value: string | Date, locale: 'en' | 'bn' = 'en'): string {
  const date = toDate(value)
  if (!isValid(date)) return '—'
  return formatDistanceToNow(date, { addSuffix: true, locale: locale === 'bn' ? bn : undefined })
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function isoDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}
