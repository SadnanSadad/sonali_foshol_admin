import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, ArrowRight, Package, ShoppingBag, TrendingUp, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ErrorState, TableSkeleton } from '@/components/shared/StateViews'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { ORDER_STATUS_CONFIG } from '@/config/orderStatus'
import {
  useDashboardSummaryQuery,
  useSalesQuery,
  useStatusBreakdownQuery,
  useTopProductsQuery,
} from '@/hooks/queries/dashboard'
import { useOrdersQuery } from '@/hooks/queries/orders'
import { useProductsQuery } from '@/hooks/queries/products'
import { useSettingsQuery } from '@/hooks/queries/settings'
import { formatBDT, formatNumber } from '@/utils/format'
import { formatDate } from '@/utils/date'

const RANGES = ['7d', '30d', '90d'] as const
type Range = (typeof RANGES)[number]

const salesConfig: ChartConfig = {
  revenue: { label: 'Revenue', color: 'var(--chart-1)' },
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'bn' ? 'bn' : 'en'
  const [range, setRange] = useState<Range>('30d')

  const summaryQuery = useDashboardSummaryQuery()
  const salesQuery = useSalesQuery(range)
  const statusQuery = useStatusBreakdownQuery()
  const topQuery = useTopProductsQuery()
  const ordersQuery = useOrdersQuery({ status: 'all', page: 1, limit: 8 })
  const productsQuery = useProductsQuery({ page: 1, limit: 100 })
  const settingsQuery = useSettingsQuery()

  const summary = summaryQuery.data
  const threshold = settingsQuery.data?.lowStockThreshold ?? 10
  const lowStock =
    productsQuery.data?.items
      .flatMap((product) =>
        product.weights
          .filter((weight) => weight.stock <= threshold)
          .map((weight) => ({ product, weight })),
      )
      .sort((a, b) => a.weight.stock - b.weight.stock)
      .slice(0, 6) ?? []

  const topProducts = topQuery.data ?? []
  const maxUnits = Math.max(1, ...topProducts.map((product) => product.unitsSold))
  const statusData = (statusQuery.data ?? []).filter((entry) => entry.count > 0)

  return (
    <div className="space-y-5">
      <PageHeader title={t('dashboard.title')} description={t('dashboard.subtitle')} />

      {summaryQuery.isError ? (
        <Card>
          <ErrorState onRetry={() => summaryQuery.refetch()} />
        </Card>
      ) : summaryQuery.isLoading || !summary ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[124px] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title={t('dashboard.todayOrders')}
            value={formatNumber(summary.todayOrders)}
            icon={ShoppingBag}
            hint={`${formatBDT(summary.todayRevenue)} ${t('dashboard.revenue').toLowerCase()}`}
          />
          <StatCard
            title={t('dashboard.revenue')}
            value={formatBDT(summary.revenue)}
            icon={Wallet}
            delta={summary.revenueChangePct}
            deltaLabel={t('dashboard.vsPrevious')}
          />
          <StatCard
            title={t('dashboard.pendingOrders')}
            value={formatNumber(summary.pendingOrders)}
            icon={TrendingUp}
            to="/orders?status=pending"
            hint={t('orders.viewDetails')}
          />
          <StatCard
            title={t('dashboard.lowStock')}
            value={formatNumber(summary.lowStockCount)}
            icon={AlertTriangle}
            to="/products?stock=low"
            hint={t('dashboard.lowStockTitle')}
          />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="text-base">{t('dashboard.sales')}</CardTitle>
              <p className="text-xs text-muted-foreground">{t('dashboard.revenue')}</p>
            </div>
            <div className="flex rounded-lg border border-border p-0.5">
              {RANGES.map((option) => (
                <Button
                  key={option}
                  size="sm"
                  variant={range === option ? 'secondary' : 'ghost'}
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setRange(option)}
                >
                  {t(`dashboard.range${option}`)}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {salesQuery.isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : salesQuery.isError ? (
              <ErrorState onRetry={() => salesQuery.refetch()} />
            ) : (
              <ChartContainer config={salesConfig} className="h-[260px] w-full">
                <AreaChart data={salesQuery.data} margin={{ left: 0, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={28}
                    tickFormatter={(value: string) => formatDate(value, 'dd MMM', lang)}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={52}
                    tickFormatter={(value: number) => formatBDT(value, { compact: true })}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => formatDate(String(value), 'dd MMM yyyy', lang)}
                        formatter={(value) => formatBDT(Number(value))}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    strokeWidth={2}
                    fill="url(#fillRevenue)"
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('dashboard.statusBreakdown')}</CardTitle>
          </CardHeader>
          <CardContent>
            {statusQuery.isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : statusQuery.isError ? (
              <ErrorState onRetry={() => statusQuery.refetch()} />
            ) : (
              <div className="space-y-3">
                <ChartContainer config={{}} className="mx-auto aspect-square h-[170px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="status" />} />
                    <Pie
                      data={statusData}
                      dataKey="count"
                      nameKey="status"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {statusData.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={ORDER_STATUS_CONFIG[entry.status].color}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  {(statusQuery.data ?? []).map((entry) => {
                    const config = ORDER_STATUS_CONFIG[entry.status]
                    return (
                      <li key={entry.status} className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: config.color }}
                          />
                          <span className="text-muted-foreground">
                            {lang === 'bn' ? config.labelBn : config.label}
                          </span>
                        </span>
                        <span className="tabular font-medium">{entry.count}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{t('dashboard.recentOrders')}</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/orders">
                {t('dashboard.viewAll')}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {ordersQuery.isLoading ? (
              <TableSkeleton rows={5} columns={4} />
            ) : ordersQuery.isError ? (
              <ErrorState onRetry={() => ordersQuery.refetch()} />
            ) : (
              <ul className="divide-y divide-border">
                {(ordersQuery.data?.items ?? []).map((order) => (
                  <li key={order.id}>
                    <Link
                      to={`/orders/${order.id}`}
                      className="flex items-center gap-3 py-2.5 transition-colors hover:text-primary"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                        <Package className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="tabular truncate text-sm font-medium">{order.orderNumber}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {order.customer.name} · {order.customer.district}
                        </p>
                      </div>
                      <StatusBadge status={order.status} className="hidden sm:inline-flex" />
                      <span className="tabular shrink-0 text-sm font-semibold">
                        {formatBDT(order.total)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('dashboard.lowStockTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {productsQuery.isLoading ? (
              <TableSkeleton rows={4} columns={2} />
            ) : lowStock.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t('dashboard.noLowStock')}
              </p>
            ) : (
              <ul className="space-y-2.5">
                {lowStock.map(({ product, weight }) => (
                  <li key={`${product.id}-${weight.label}`} className="flex items-center gap-2.5">
                    <img
                      src={product.image}
                      alt={product.nameBn}
                      className="size-9 rounded-lg border border-border object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{product.nameBn}</p>
                      <p className="text-xs text-muted-foreground">{weight.label}</p>
                    </div>
                    <span
                      className={
                        weight.stock === 0
                          ? 'tabular rounded-md bg-destructive/10 px-1.5 py-0.5 text-xs font-semibold text-destructive'
                          : 'tabular rounded-md bg-[#FEF3C7] px-1.5 py-0.5 text-xs font-semibold text-[#D97706]'
                      }
                    >
                      {weight.stock}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('dashboard.topProducts')}</CardTitle>
        </CardHeader>
        <CardContent>
          {topQuery.isLoading ? (
            <TableSkeleton rows={4} columns={3} />
          ) : topQuery.isError ? (
            <ErrorState onRetry={() => topQuery.refetch()} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {topProducts.map((product, index) => (
                <div key={product.productId} className="flex items-center gap-3">
                  <span className="tabular w-5 text-sm font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                  <img
                    src={product.image}
                    alt={product.nameBn}
                    className="size-10 rounded-lg border border-border object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-medium">{product.nameBn}</p>
                      <span className="tabular shrink-0 text-xs text-muted-foreground">
                        {formatBDT(product.revenue)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(product.unitsSold / maxUnits) * 100}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {product.unitsSold} {t('dashboard.units')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
