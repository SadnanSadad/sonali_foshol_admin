export function buildQueryParams(params: Record<string, unknown>): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') return
    search.set(key, String(value))
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

export function parsePage(value: string | null, fallback = 1): number {
  const page = Number(value)
  return Number.isFinite(page) && page > 0 ? page : fallback
}
