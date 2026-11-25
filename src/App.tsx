import { lazy, Suspense, type ReactNode, useEffect } from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { PageLoader } from '@/components/shared/StateViews'
import DashboardPage from '@/pages/DashboardPage'
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'
import { fetchMe } from '@/api/auth.api'
import { useAuthStore } from '@/store/auth.store'

const ProductsPage = lazy(() => import('@/pages/ProductsPage'))
const ProductFormPage = lazy(() => import('@/pages/ProductFormPage'))
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'))
const OrdersPage = lazy(() => import('@/pages/OrdersPage'))
const OrderDetailsPage = lazy(() => import('@/pages/OrderDetailsPage'))
const CalendarPage = lazy(() => import('@/pages/CalendarPage'))
const CustomersPage = lazy(() => import('@/pages/CustomersPage'))
const CustomerDetailsPage = lazy(() => import('@/pages/CustomerDetailsPage'))
const ReviewsPage = lazy(() => import('@/pages/ReviewsPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))

function page(node: ReactNode) {
  return <Suspense fallback={<PageLoader />}>{node}</Suspense>
}

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'products', element: page(<ProductsPage />) },
      { path: 'products/new', element: page(<ProductFormPage />) },
      { path: 'products/:productId/edit', element: page(<ProductFormPage />) },
      { path: 'categories', element: page(<CategoriesPage />) },
      { path: 'orders', element: page(<OrdersPage />) },
      { path: 'orders/:orderId', element: page(<OrderDetailsPage />) },
      { path: 'calendar', element: page(<CalendarPage />) },
      { path: 'customers', element: page(<CustomersPage />) },
      { path: 'customers/:customerId', element: page(<CustomerDetailsPage />) },
      { path: 'reviews', element: page(<ReviewsPage />) },
      { path: 'settings', element: page(<SettingsPage />) },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])

export default function App() {
  const setUser = useAuthStore((state) => state.setUser)
  const setBootstrapping = useAuthStore((state) => state.setBootstrapping)

  useEffect(() => {
    let active = true

    async function bootstrap() {
      setBootstrapping(true)
      try {
        const user = await fetchMe()
        if (active) setUser(user)
      } catch {
        // 401 => no session; remain unauthenticated
      } finally {
        if (active) setBootstrapping(false)
      }
    }

    bootstrap()
    return () => {
      active = false
    }
  }, [setUser, setBootstrapping])

  return <RouterProvider router={router} />
}
