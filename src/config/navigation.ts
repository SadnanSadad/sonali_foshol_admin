import {
  CalendarDays,
  LayoutDashboard,
  Package,
  PlusCircle,
  Settings,
  ShoppingBag,
  Star,
  Tags,
  Users,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  key: string
  labelKey: string
  to: string
  icon: LucideIcon
  end?: boolean
  badge?: 'pendingOrders'
}

export interface NavGroup {
  key: string
  labelKey: string
  items: NavItem[]
}

export const navigation: NavGroup[] = [
  {
    key: 'overview',
    labelKey: 'nav.group.overview',
    items: [{ key: 'dashboard', labelKey: 'nav.dashboard', to: '/', icon: LayoutDashboard, end: true }],
  },
  {
    key: 'catalog',
    labelKey: 'nav.group.catalog',
    items: [
      { key: 'products', labelKey: 'nav.products', to: '/products', icon: Package },
      { key: 'add-product', labelKey: 'nav.addProduct', to: '/products/new', icon: PlusCircle },
      { key: 'categories', labelKey: 'nav.categories', to: '/categories', icon: Tags },
    ],
  },
  {
    key: 'sales',
    labelKey: 'nav.group.sales',
    items: [
      {
        key: 'orders',
        labelKey: 'nav.orders',
        to: '/orders',
        icon: ShoppingBag,
        badge: 'pendingOrders',
      },
      { key: 'calendar', labelKey: 'nav.calendar', to: '/calendar', icon: CalendarDays },
      { key: 'customers', labelKey: 'nav.customers', to: '/customers', icon: Users },
    ],
  },
  {
    key: 'engagement',
    labelKey: 'nav.group.engagement',
    items: [{ key: 'reviews', labelKey: 'nav.reviews', to: '/reviews', icon: Star }],
  },
  {
    key: 'system',
    labelKey: 'nav.group.system',
    items: [{ key: 'settings', labelKey: 'nav.settings', to: '/settings', icon: Settings }],
  },
]
