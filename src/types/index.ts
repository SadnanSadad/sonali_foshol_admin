export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'rejected'
  | 'cancelled'

export type PaymentMethod = 'cod' | 'whatsapp' | 'messenger'
export type DeliveryZone = 'inside_dhaka' | 'outside_dhaka'
export type ProductStatus = 'active' | 'draft'
export type ReviewStatus = 'pending' | 'approved' | 'hidden'
export type AdminRole = 'superadmin' | 'admin'

export interface AdminUser {
  id: string
  name: string
  email: string
  username?: string | null
  role: AdminRole
  avatar?: string | null
  isActive: boolean
  lastLoginAt: string
  twoFactorEnabled: boolean
}

export interface NutritionFact {
  labelBn: string
  valueBn: string
}

export interface WeightVariant {
  label: string
  grams: number
  price: number
  mrp: number
  stock: number
  sku?: string
}

export interface AdminProduct {
  id: string
  slug: string
  nameBn: string
  nameEn?: string
  category: string
  originBn: string
  image: string
  images: string[]
  badgeBn?: string
  inStock: boolean
  status: ProductStatus
  shortDescBn: string
  fullDescBn: string
  nutritionHighlights: string[]
  nutritionFacts?: NutritionFact[]
  cookingTipsBn?: string
  weights: WeightVariant[]
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  slug: string
  nameEn: string
  nameBn: string
  order: number
  hidden: boolean
  productCount?: number
}

export interface OrderItem {
  productId: string
  slug: string
  title: string
  image: string
  weightLabel: string
  unitPrice: number
  qty: number
}

export interface OrderCustomer {
  name: string
  phone: string
  district: string
  address: string
  note?: string
}

export interface RejectionInfo {
  reason: string
  feedback: string
  by: string
  at: string
}

export interface CourierInfo {
  name: string
  trackingId?: string
}

export interface StatusHistoryEntry {
  status: OrderStatus
  at: string
  by: string
  note?: string
}

export interface Order {
  id: string
  orderNumber: string
  createdAt: string
  expectedDeliveryDate?: string
  status: OrderStatus
  customer: OrderCustomer
  deliveryZone: DeliveryZone
  paymentMethod: PaymentMethod
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  rejection?: RejectionInfo
  courier?: CourierInfo
  statusHistory: StatusHistoryEntry[]
}

export interface Customer {
  id: string
  name: string
  phone: string
  district: string
  address: string
  orderCount: number
  totalSpent: number
  flagged: boolean
  createdAt: string
  lastOrderAt?: string
}

export interface Review {
  id: string
  productId: string | null
  productNameBn: string | null
  author: string
  location: string | null
  rating: number
  text: string
  status: ReviewStatus
  createdAt: string
}

export type CalendarEventType = 'admin' | 'delivery'

export interface CalendarEvent {
  id: string
  title: string
  type: CalendarEventType
  start: string
  end?: string
  allDay: boolean
  note?: string
  orderId?: string
}

export interface StoreSettings {
  storeName: string
  storeNameBn: string
  brandTaglineBn: string
  whatsappNumber: string
  facebookUrl: string
  messengerUrl: string
  phoneDisplay: string | null
  email: string | null
  addressBn: string | null
  deliveryFeeInside: number
  deliveryFeeOutside: number
  freeShippingThreshold: number
  lowStockThreshold: number
  insideDeliveryDays: number
  outsideDeliveryDays: number
}

export interface DashboardSummary {
  todayOrders: number
  todayRevenue: number
  pendingOrders: number
  lowStockCount: number
  revenue: number
  orderCount: number
  averageOrderValue: number
  revenueChangePct: number
  orderChangePct: number
}

export interface SalesPoint {
  date: string
  revenue: number
  orders: number
}

export interface StatusBreakdownItem {
  status: OrderStatus
  count: number
  total: number
}

export interface TopProduct {
  productId: string
  nameBn: string
  slug: string
  image: string
  unitsSold: number
  revenue: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface Paginated<T> {
  items: T[]
  meta: PaginationMeta
}

export interface ApiEnvelope<T> {
  success: boolean
  data: T
  meta?: PaginationMeta
  message?: string
  errors?: Record<string, string>
}

export interface ProductFilters {
  category?: string
  search?: string
  stock?: 'all' | 'in' | 'low' | 'out'
  status?: 'all' | 'active' | 'draft'
  sort?: 'newest' | 'name' | 'price' | 'stock'
  page?: number
  limit?: number
}

export interface OrderFilters {
  status?: OrderStatus | 'all'
  search?: string
  from?: string
  to?: string
  zone?: DeliveryZone | 'all'
  payment?: PaymentMethod | 'all'
  page?: number
  limit?: number
}

export interface CustomerFilters {
  search?: string
  flagged?: 'all' | 'yes' | 'no'
  page?: number
  limit?: number
}

export interface ReviewFilters {
  status?: ReviewStatus | 'all'
  search?: string
  page?: number
  limit?: number
}
