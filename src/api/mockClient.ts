import { canTransition, ORDER_STATUSES } from '@/config/orderStatus'
import type {
  AdminProduct,
  AdminUser,
  CalendarEvent,
  Category,
  Customer,
  CustomerFilters,
  DashboardSummary,
  Order,
  OrderFilters,
  OrderStatus,
  Paginated,
  ProductFilters,
  Review,
  ReviewFilters,
  SalesPoint,
  StatusBreakdownItem,
  StoreSettings,
  TopProduct,
} from '@/types'
import type { LoginResult } from '@/api/auth.api'

const DB_KEY = 'sfo-admin-mock-db'

export class ApiError extends Error {
  status: number
  errors?: Record<string, string>

  constructor(message: string, status = 400, errors?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

interface MockDb {
  products: AdminProduct[]
  categories: Category[]
  orders: Order[]
  customers: Customer[]
  reviews: Review[]
  events: CalendarEvent[]
  settings: StoreSettings
}

interface DashboardFile {
  sales: SalesPoint[]
}

let dbPromise: Promise<MockDb> | null = null
let adminPromise: Promise<AdminUser & { password: string }> | null = null
let dashboardPromise: Promise<DashboardFile> | null = null

async function fetchJson<T>(file: string): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/${file}`)
  if (!response.ok) throw new ApiError(`Could not load ${file}`, 500)
  return (await response.json()) as T
}

function readOverlay(): MockDb | null {
  const raw = localStorage.getItem(DB_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as MockDb
  } catch {
    localStorage.removeItem(DB_KEY)
    return null
  }
}

async function loadDb(): Promise<MockDb> {
  const overlay = readOverlay()
  if (overlay) return overlay
  const [products, categories, orders, customers, reviews, events, settings] = await Promise.all([
    fetchJson<AdminProduct[]>('products.json'),
    fetchJson<Category[]>('categories.json'),
    fetchJson<Order[]>('orders.json'),
    fetchJson<Customer[]>('customers.json'),
    fetchJson<Review[]>('reviews.json'),
    fetchJson<CalendarEvent[]>('calendar-events.json'),
    fetchJson<StoreSettings>('settings.json'),
  ])
  return { products, categories, orders, customers, reviews, events, settings }
}

function getDb(): Promise<MockDb> {
  dbPromise ??= loadDb()
  return dbPromise
}

function persist(db: MockDb) {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

function getAdmin(): Promise<AdminUser & { password: string }> {
  adminPromise ??= fetchJson<AdminUser & { password: string }>('admin.json')
  return adminPromise
}

function getDashboardFile(): Promise<DashboardFile> {
  dashboardPromise ??= fetchJson<DashboardFile>('dashboard.json')
  return dashboardPromise
}

const sleep = () => new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300))

async function simulate<T>(producer: () => Promise<T> | T): Promise<T> {
  await sleep()
  if (new URLSearchParams(window.location.search).get('mockError') === '1') {
    throw new ApiError('Simulated network error (?mockError=1)', 500)
  }
  return producer()
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function paginate<T>(items: T[], page = 1, limit = 10): Paginated<T> {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * limit
  return {
    items: items.slice(start, start + limit),
    meta: { page: safePage, limit, total, totalPages },
  }
}

function matches(value: string | null | undefined, query: string): boolean {
  return (value ?? '').toLowerCase().includes(query.toLowerCase())
}

function totalStock(product: AdminProduct): number {
  return product.weights.reduce((sum, weight) => sum + weight.stock, 0)
}

function priceBounds(product: AdminProduct): { min: number; max: number } {
  const prices = product.weights.map((weight) => weight.price)
  return { min: Math.min(...prices), max: Math.max(...prices) }
}

function nextId(prefix: string, values: { id: string }[]): string {
  const max = values.reduce((highest, value) => {
    const parsed = Number(value.id.replace(/\D/g, ''))
    return Number.isFinite(parsed) ? Math.max(highest, parsed) : highest
  }, 0)
  return `${prefix}-${String(max + 1).padStart(3, '0')}`
}

function isCounted(order: Order): boolean {
  return order.status !== 'rejected' && order.status !== 'cancelled'
}

function computeCustomers(db: MockDb): Customer[] {
  return db.customers.map((customer) => {
    const orders = db.orders.filter((order) => order.customer.phone === customer.phone)
    const totalSpent = orders
      .filter(isCounted)
      .reduce((sum, order) => sum + order.total, 0)
    const lastOrderAt = orders
      .map((order) => order.createdAt)
      .sort()
      .at(-1)
    return { ...customer, orderCount: orders.length, totalSpent, lastOrderAt }
  })
}

function todayKey(): string {
  const date = new Date()
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function dateKey(iso: string): string {
  const date = new Date(iso)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function summarize(db: MockDb): DashboardSummary {
  const counted = db.orders.filter(isCounted)
  const today = todayKey()
  const todayOrders = db.orders.filter((order) => dateKey(order.createdAt) === today)
  const revenue = counted.reduce((sum, order) => sum + order.total, 0)
  const now = Date.now()
  const last30 = counted.filter((order) => now - new Date(order.createdAt).getTime() <= 30 * 86400000)
  const prev30 = counted.filter((order) => {
    const age = now - new Date(order.createdAt).getTime()
    return age > 30 * 86400000 && age <= 60 * 86400000
  })
  const last30Revenue = last30.reduce((sum, order) => sum + order.total, 0)
  const prev30Revenue = prev30.reduce((sum, order) => sum + order.total, 0)
  const change = (current: number, previous: number) =>
    previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 1000) / 10
  const lowStockThreshold = db.settings.lowStockThreshold
  return {
    todayOrders: todayOrders.length,
    todayRevenue: todayOrders.filter(isCounted).reduce((sum, order) => sum + order.total, 0),
    pendingOrders: db.orders.filter((order) => order.status === 'pending').length,
    lowStockCount: db.products.filter((product) =>
      product.weights.some((weight) => weight.stock <= lowStockThreshold),
    ).length,
    revenue,
    orderCount: counted.length,
    averageOrderValue: counted.length ? Math.round(revenue / counted.length) : 0,
    revenueChangePct: change(last30Revenue, prev30Revenue),
    orderChangePct: change(last30.length, prev30.length),
  }
}

export const mockApi = {
  async login(payload: { email: string; password: string }): Promise<LoginResult> {
    return simulate(async () => {
      const admin = await getAdmin()
      const identifier = payload.email.trim().toLowerCase()
      const matchesAdmin =
        (admin.email.toLowerCase() === identifier ||
          (admin.username ?? '').toLowerCase() === identifier) &&
        admin.password === payload.password
      if (!matchesAdmin) throw new ApiError('Invalid email or password', 401)
      const { password: _password, ...user } = admin
      return {
        kind: 'authenticated',
        user: {
          ...user,
          role: (user.role as AdminUser['role']) ?? 'admin',
          isActive: true,
          lastLoginAt: new Date().toISOString(),
          twoFactorEnabled: false,
        },
      }
    })
  },

  async me(): Promise<AdminUser> {
    return simulate(async () => {
      const admin = await getAdmin()
      const { password: _password, ...user } = admin
      return clone({
        ...user,
        role: (user.role as AdminUser['role']) ?? 'admin',
        isActive: true,
        lastLoginAt: new Date().toISOString(),
        twoFactorEnabled: false,
      } as AdminUser)
    })
  },

  async logout(): Promise<{ success: boolean }> {
    return simulate(() => ({ success: true }))
  },

  async dashboardSummary(): Promise<DashboardSummary> {
    return simulate(async () => summarize(await getDb()))
  },

  async dashboardSales(range: string): Promise<SalesPoint[]> {
    return simulate(async () => {
      const file = await getDashboardFile()
      const days = range === '7d' ? 7 : range === '90d' ? 90 : 30
      return clone(file.sales.slice(-days))
    })
  },

  async dashboardStatusBreakdown(): Promise<StatusBreakdownItem[]> {
    return simulate(async () => {
      const db = await getDb()
      return ORDER_STATUSES.map((status) => {
        const orders = db.orders.filter((order) => order.status === status)
        return {
          status,
          count: orders.length,
          total: orders.reduce((sum, order) => sum + order.total, 0),
        }
      })
    })
  },

  async dashboardTopProducts(): Promise<TopProduct[]> {
    return simulate(async () => {
      const db = await getDb()
      const aggregate = new Map<string, TopProduct>()
      db.orders.filter(isCounted).forEach((order) => {
        order.items.forEach((item) => {
          const existing = aggregate.get(item.productId)
          if (existing) {
            existing.unitsSold += item.qty
            existing.revenue += item.unitPrice * item.qty
          } else {
            aggregate.set(item.productId, {
              productId: item.productId,
              nameBn: item.title,
              slug: item.slug,
              image: item.image,
              unitsSold: item.qty,
              revenue: item.unitPrice * item.qty,
            })
          }
        })
      })
      return clone(
        [...aggregate.values()].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5),
      )
    })
  },

  async products(filters: ProductFilters): Promise<Paginated<AdminProduct>> {
    return simulate(async () => {
      const db = await getDb()
      const threshold = db.settings.lowStockThreshold
      let items = [...db.products]

      if (filters.category && filters.category !== 'all') {
        items = items.filter((product) => product.category === filters.category)
      }
      if (filters.search) {
        items = items.filter(
          (product) =>
            matches(product.nameBn, filters.search!) ||
            matches(product.nameEn, filters.search!) ||
            matches(product.slug, filters.search!),
        )
      }
      if (filters.status && filters.status !== 'all') {
        items = items.filter((product) => product.status === filters.status)
      }
      if (filters.stock && filters.stock !== 'all') {
        items = items.filter((product) => {
          const stock = totalStock(product)
          if (filters.stock === 'in') return stock > threshold
          if (filters.stock === 'low') return stock > 0 && stock <= threshold
          return stock === 0
        })
      }

      const sort = filters.sort ?? 'newest'
      items.sort((a, b) => {
        if (sort === 'name') return a.nameBn.localeCompare(b.nameBn, 'bn')
        if (sort === 'price') return priceBounds(a).min - priceBounds(b).min
        if (sort === 'stock') return totalStock(b) - totalStock(a)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })

      return paginate(clone(items), filters.page, filters.limit)
    })
  },

  async product(id: string): Promise<AdminProduct> {
    return simulate(async () => {
      const db = await getDb()
      const product = db.products.find((entry) => entry.id === id)
      if (!product) throw new ApiError('Product not found', 404)
      return clone(product)
    })
  },

  async productBySlug(slug: string): Promise<AdminProduct | null> {
    return simulate(async () => {
      const db = await getDb()
      const product = db.products.find((entry) => entry.slug === slug)
      return product ? clone(product) : null
    })
  },

  async createProduct(
    payload: Omit<AdminProduct, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<AdminProduct> {
    return simulate(async () => {
      const db = await getDb()
      if (db.products.some((product) => product.slug === payload.slug)) {
        throw new ApiError('Validation failed', 422, { slug: 'Slug already exists' })
      }
      const now = new Date().toISOString()
      const product: AdminProduct = {
        ...payload,
        id: nextId('prd', db.products),
        createdAt: now,
        updatedAt: now,
      }
      db.products.unshift(product)
      persist(db)
      return clone(product)
    })
  },

  async updateProduct(id: string, payload: Partial<AdminProduct>): Promise<AdminProduct> {
    return simulate(async () => {
      const db = await getDb()
      const index = db.products.findIndex((product) => product.id === id)
      if (index === -1) throw new ApiError('Product not found', 404)
      if (
        payload.slug &&
        db.products.some((product) => product.slug === payload.slug && product.id !== id)
      ) {
        throw new ApiError('Validation failed', 422, { slug: 'Slug already exists' })
      }
      const updated: AdminProduct = {
        ...db.products[index],
        ...payload,
        id,
        updatedAt: new Date().toISOString(),
      }
      db.products[index] = updated
      persist(db)
      return clone(updated)
    })
  },

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    return simulate(async () => {
      const db = await getDb()
      db.products = db.products.filter((product) => product.id !== id)
      persist(db)
      return { success: true }
    })
  },

  async bulkProducts(action: 'publish' | 'unpublish' | 'delete', ids: string[]): Promise<{ count: number }> {
    return simulate(async () => {
      const db = await getDb()
      if (action === 'delete') {
        db.products = db.products.filter((product) => !ids.includes(product.id))
      } else {
        db.products = db.products.map((product) =>
          ids.includes(product.id)
            ? { ...product, status: action === 'publish' ? 'active' : 'draft', updatedAt: new Date().toISOString() }
            : product,
        )
      }
      persist(db)
      return { count: ids.length }
    })
  },

  async uploadImage(file: File): Promise<{ url: string }> {
    return simulate(async () => {
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(reader.error ?? new Error('Could not read image'))
        reader.readAsDataURL(file)
      })
      return { url }
    })
  },

  async categories(): Promise<Category[]> {
    return simulate(async () => {
      const db = await getDb()
      return clone(
        [...db.categories]
          .sort((a, b) => a.order - b.order)
          .map((category) => ({
            ...category,
            productCount: db.products.filter((product) => product.category === category.slug).length,
          })),
      )
    })
  },

  async createCategory(payload: Omit<Category, 'id' | 'order'>): Promise<Category> {
    return simulate(async () => {
      const db = await getDb()
      if (db.categories.some((category) => category.slug === payload.slug)) {
        throw new ApiError('Validation failed', 422, { slug: 'Slug already exists' })
      }
      const category: Category = {
        ...payload,
        id: nextId('cat', db.categories),
        order: db.categories.length + 1,
      }
      db.categories.push(category)
      persist(db)
      return clone(category)
    })
  },

  async updateCategory(id: string, payload: Partial<Category>): Promise<Category> {
    return simulate(async () => {
      const db = await getDb()
      const index = db.categories.findIndex((category) => category.id === id)
      if (index === -1) throw new ApiError('Category not found', 404)
      const updated = { ...db.categories[index], ...payload, id }
      db.categories[index] = updated
      persist(db)
      return clone(updated)
    })
  },

  async deleteCategory(id: string): Promise<{ success: boolean }> {
    return simulate(async () => {
      const db = await getDb()
      const category = db.categories.find((entry) => entry.id === id)
      if (!category) throw new ApiError('Category not found', 404)
      if (db.products.some((product) => product.category === category.slug)) {
        throw new ApiError('This category still has products', 409)
      }
      db.categories = db.categories.filter((entry) => entry.id !== id)
      persist(db)
      return { success: true }
    })
  },

  async orders(filters: OrderFilters): Promise<Paginated<Order>> {
    return simulate(async () => {
      const db = await getDb()
      let items = [...db.orders]

      if (filters.status && filters.status !== 'all') {
        items = items.filter((order) => order.status === filters.status)
      }
      if (filters.search) {
        items = items.filter(
          (order) =>
            matches(order.orderNumber, filters.search!) ||
            matches(order.id, filters.search!) ||
            matches(order.customer.name, filters.search!) ||
            matches(order.customer.phone, filters.search!),
        )
      }
      if (filters.zone && filters.zone !== 'all') {
        items = items.filter((order) => order.deliveryZone === filters.zone)
      }
      if (filters.payment && filters.payment !== 'all') {
        items = items.filter((order) => order.paymentMethod === filters.payment)
      }
      if (filters.from) {
        items = items.filter((order) => new Date(order.createdAt) >= new Date(filters.from!))
      }
      if (filters.to) {
        const to = new Date(filters.to)
        to.setHours(23, 59, 59, 999)
        items = items.filter((order) => new Date(order.createdAt) <= to)
      }

      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      return paginate(clone(items), filters.page, filters.limit)
    })
  },

  async order(id: string): Promise<Order> {
    return simulate(async () => {
      const db = await getDb()
      const order = db.orders.find((entry) => entry.id === id)
      if (!order) throw new ApiError('Order not found', 404)
      return clone(order)
    })
  },

  async updateOrderStatus(
    id: string,
    payload: {
      status: OrderStatus
      reason?: string
      feedback?: string
      courier?: string
      trackingId?: string
    },
  ): Promise<Order> {
    return simulate(async () => {
      const db = await getDb()
      const index = db.orders.findIndex((entry) => entry.id === id)
      if (index === -1) throw new ApiError('Order not found', 404)
      const order = db.orders[index]
      if (!canTransition(order.status, payload.status)) {
        throw new ApiError(`Cannot move order from ${order.status} to ${payload.status}`, 422)
      }
      const admin = await getAdmin()
      const now = new Date().toISOString()
      const updated: Order = {
        ...order,
        status: payload.status,
        statusHistory: [
          ...order.statusHistory,
          { status: payload.status, at: now, by: admin.name, note: payload.reason ?? payload.feedback },
        ],
      }
      if (payload.status === 'rejected') {
        updated.rejection = {
          reason: payload.reason ?? 'other',
          feedback: payload.feedback ?? '',
          by: admin.name,
          at: now,
        }
      }
      if (payload.status === 'shipped') {
        updated.courier = {
          name: payload.courier || 'Pathao',
          trackingId: payload.trackingId || undefined,
        }
      }
      db.orders[index] = updated
      persist(db)
      return clone(updated)
    })
  },

  async calendarEvents(from: string, to: string): Promise<CalendarEvent[]> {
    return simulate(async () => {
      const db = await getDb()
      const fromTime = new Date(from).getTime()
      const toTime = new Date(to).getTime()
      const inRange = (value: string) => {
        const time = new Date(value).getTime()
        return time >= fromTime && time <= toTime
      }
      const deliveries: CalendarEvent[] = db.orders
        .filter((order) => order.expectedDeliveryDate && inRange(order.expectedDeliveryDate))
        .map((order) => ({
          id: `delivery-${order.id}`,
          title: `${order.orderNumber} · ${order.customer.name}`,
          type: 'delivery',
          start: order.expectedDeliveryDate!,
          allDay: true,
          note: order.customer.district,
          orderId: order.id,
        }))
      const adminEvents = db.events.filter((event) => inRange(event.start))
      return clone([...adminEvents, ...deliveries])
    })
  },

  async createCalendarEvent(
    payload: Omit<CalendarEvent, 'id' | 'type'> & { type?: 'admin' },
  ): Promise<CalendarEvent> {
    return simulate(async () => {
      const db = await getDb()
      const event: CalendarEvent = {
        ...payload,
        type: 'admin',
        id: nextId('evt', db.events),
      }
      db.events.push(event)
      persist(db)
      return clone(event)
    })
  },

  async updateCalendarEvent(id: string, payload: Partial<CalendarEvent>): Promise<CalendarEvent> {
    return simulate(async () => {
      const db = await getDb()
      if (id.startsWith('delivery-')) {
        const orderId = id.replace('delivery-', '')
        const index = db.orders.findIndex((order) => order.id === orderId)
        if (index === -1) throw new ApiError('Order not found', 404)
        db.orders[index] = {
          ...db.orders[index],
          expectedDeliveryDate: payload.start ?? db.orders[index].expectedDeliveryDate,
        }
        persist(db)
        return {
          id,
          title: db.orders[index].orderNumber,
          type: 'delivery',
          start: db.orders[index].expectedDeliveryDate ?? payload.start ?? new Date().toISOString(),
          allDay: true,
          orderId,
        }
      }
      const index = db.events.findIndex((event) => event.id === id)
      if (index === -1) throw new ApiError('Event not found', 404)
      const updated = { ...db.events[index], ...payload, id, type: 'admin' as const }
      db.events[index] = updated
      persist(db)
      return clone(updated)
    })
  },

  async deleteCalendarEvent(id: string): Promise<{ success: boolean }> {
    return simulate(async () => {
      const db = await getDb()
      db.events = db.events.filter((event) => event.id !== id)
      persist(db)
      return { success: true }
    })
  },

  async customers(filters: CustomerFilters): Promise<Paginated<Customer>> {
    return simulate(async () => {
      const db = await getDb()
      let items = computeCustomers(db)
      if (filters.search) {
        items = items.filter(
          (customer) => matches(customer.name, filters.search!) || matches(customer.phone, filters.search!),
        )
      }
      if (filters.flagged && filters.flagged !== 'all') {
        items = items.filter((customer) => (filters.flagged === 'yes' ? customer.flagged : !customer.flagged))
      }
      items.sort(
        (a, b) =>
          new Date(b.lastOrderAt ?? b.createdAt).getTime() -
          new Date(a.lastOrderAt ?? a.createdAt).getTime(),
      )
      return paginate(clone(items), filters.page, filters.limit)
    })
  },

  async customer(id: string): Promise<Customer> {
    return simulate(async () => {
      const db = await getDb()
      const customer = computeCustomers(db).find((entry) => entry.id === id)
      if (!customer) throw new ApiError('Customer not found', 404)
      return clone(customer)
    })
  },

  async customerOrders(id: string): Promise<Order[]> {
    return simulate(async () => {
      const db = await getDb()
      const customer = db.customers.find((entry) => entry.id === id)
      if (!customer) throw new ApiError('Customer not found', 404)
      return clone(db.orders.filter((order) => order.customer.phone === customer.phone))
    })
  },

  async flagCustomer(id: string, flagged: boolean): Promise<Customer> {
    return simulate(async () => {
      const db = await getDb()
      const index = db.customers.findIndex((customer) => customer.id === id)
      if (index === -1) throw new ApiError('Customer not found', 404)
      db.customers[index] = { ...db.customers[index], flagged }
      persist(db)
      return clone(db.customers[index])
    })
  },

  async reviews(filters: ReviewFilters): Promise<Paginated<Review>> {
    return simulate(async () => {
      const db = await getDb()
      let items = [...db.reviews]
      if (filters.status && filters.status !== 'all') {
        items = items.filter((review) => review.status === filters.status)
      }
      if (filters.search) {
        items = items.filter(
          (review) =>
            matches(review.text, filters.search!) ||
            matches(review.author, filters.search!) ||
            matches(review.productNameBn, filters.search!),
        )
      }
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      return paginate(clone(items), filters.page, filters.limit)
    })
  },

  async updateReview(id: string, status: Review['status']): Promise<Review> {
    return simulate(async () => {
      const db = await getDb()
      const index = db.reviews.findIndex((review) => review.id === id)
      if (index === -1) throw new ApiError('Review not found', 404)
      const updated = { ...db.reviews[index], status }
      db.reviews[index] = updated
      persist(db)
      return clone(updated)
    })
  },

  async deleteReview(id: string): Promise<{ success: boolean }> {
    return simulate(async () => {
      const db = await getDb()
      db.reviews = db.reviews.filter((review) => review.id !== id)
      persist(db)
      return { success: true }
    })
  },

  async settings(): Promise<StoreSettings> {
    return simulate(async () => clone((await getDb()).settings))
  },

  async updateSettings(payload: Partial<StoreSettings>): Promise<StoreSettings> {
    return simulate(async () => {
      const db = await getDb()
      db.settings = { ...db.settings, ...payload }
      persist(db)
      return clone(db.settings)
    })
  },

  async reset(): Promise<{ success: boolean }> {
    return simulate(() => {
      localStorage.removeItem(DB_KEY)
      dbPromise = null
      return { success: true }
    })
  },
}
