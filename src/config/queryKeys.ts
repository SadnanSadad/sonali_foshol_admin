import type { CustomerFilters, OrderFilters, ProductFilters, ReviewFilters } from '@/types'

export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  dashboard: {
    summary: ['dashboard', 'summary'] as const,
    sales: (range: string) => ['dashboard', 'sales', range] as const,
    statusBreakdown: ['dashboard', 'status-breakdown'] as const,
    topProducts: ['dashboard', 'top-products'] as const,
  },
  products: {
    all: ['products'] as const,
    list: (filters: ProductFilters) => ['products', filters] as const,
    detail: (id: string) => ['product', id] as const,
    slug: (slug: string) => ['product', 'slug', slug] as const,
  },
  categories: {
    all: ['categories'] as const,
  },
  orders: {
    all: ['orders'] as const,
    list: (filters: OrderFilters) => ['orders', filters] as const,
    detail: (id: string) => ['order', id] as const,
  },
  calendar: {
    events: (from: string, to: string) => ['calendar', from, to] as const,
  },
  customers: {
    all: ['customers'] as const,
    list: (filters: CustomerFilters) => ['customers', filters] as const,
    detail: (id: string) => ['customer', id] as const,
  },
  reviews: {
    all: ['reviews'] as const,
    list: (filters: ReviewFilters) => ['reviews', filters] as const,
  },
  settings: {
    all: ['settings'] as const,
  },
}
