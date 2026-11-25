import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { CheckCircle2, Eye, MoreHorizontal, XCircle } from 'lucide-react'
import { DataTable } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { RejectOrderDialog } from '@/components/orders/RejectOrderDialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ORDER_STATUSES, ORDER_STATUS_CONFIG, canTransition } from '@/config/orderStatus'
import { useOrdersQuery } from '@/hooks/queries/orders'
import { useUpdateOrderStatusMutation } from '@/hooks/mutations/orders'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatDate } from '@/utils/date'
import { formatBDT } from '@/utils/format'
import { parsePage } from '@/utils/query'
import type { DeliveryZone, Order, OrderFilters, OrderStatus, PaymentMethod } from '@/types'

function paymentLabel(value: PaymentMethod, t: (key: string) => string): string {
  if (value === 'cod') return t('orders.cod')
  if (value === 'whatsapp') return t('orders.whatsapp')
  return t('orders.messenger')
}

export default function OrdersPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'bn' ? 'bn' : 'en'
  const [searchParams, setSearchParams] = useSearchParams()

  const status = (searchParams.get('status') as OrderStatus | 'all') ?? 'all'
  const zone = (searchParams.get('zone') as DeliveryZone | 'all') ?? 'all'
  const payment = (searchParams.get('payment') as PaymentMethod | 'all') ?? 'all'
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''
  const page = parsePage(searchParams.get('page'))
  const search = searchParams.get('q') ?? ''
  const [searchInput, setSearchInput] = useState(search)
  const debouncedSearch = useDebouncedValue(searchInput, 350)

  const setParam = useCallback(
    (key: string, value: string | null) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          if (value && value !== 'all') next.set(key, value)
          else next.delete(key)
          if (key !== 'page') next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  useEffect(() => {
    if (debouncedSearch === (searchParams.get('q') ?? '')) return
    setParam('q', debouncedSearch || null)
  }, [debouncedSearch, searchParams, setParam])

  const filters: OrderFilters = {
    status,
    search: search || undefined,
    zone,
    payment,
    from: from || undefined,
    to: to || undefined,
    page,
    limit: 10,
  }

  const ordersQuery = useOrdersQuery(filters)
  const countsQuery = useOrdersQuery({ status: 'all', page: 1, limit: 100 })
  const mutation = useUpdateOrderStatusMutation()

  const [rejectOrder, setRejectOrder] = useState<Order | null>(null)

  const counts = useMemo(() => {
    const items = countsQuery.data?.items ?? []
    const map: Record<string, number> = { all: items.length }
    items.forEach((order) => {
      map[order.status] = (map[order.status] ?? 0) + 1
    })
    return map
  }, [countsQuery.data])

  const confirmOrder = (order: Order) => {
    mutation.mutate({ id: order.id, status: 'confirmed' })
  }

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: 'orderNumber',
      header: t('orders.orderId'),
      cell: ({ row }) => (
        <div>
          <Link
            to={`/orders/${row.original.id}`}
            className="tabular font-semibold text-foreground hover:text-primary"
          >
            {row.original.orderNumber}
          </Link>
          <p className="text-xs text-muted-foreground">
            {formatDate(row.original.createdAt, 'dd MMM yyyy', lang)}
          </p>
        </div>
      ),
    },
    {
      id: 'customer',
      header: t('orders.customer'),
      cell: ({ row }) => (
        <div className="min-w-36">
          <p className="font-medium">{row.original.customer.name}</p>
          <p className="tabular text-xs text-muted-foreground">{row.original.customer.phone}</p>
        </div>
      ),
    },
    {
      id: 'district',
      header: t('orders.district'),
      cell: ({ row }) => row.original.customer.district,
    },
    {
      id: 'items',
      header: t('orders.items'),
      cell: ({ row }) => (
        <span className="tabular">
          {row.original.items.reduce((sum, item) => sum + item.qty, 0)}
        </span>
      ),
    },
    {
      id: 'total',
      header: t('orders.total'),
      cell: ({ row }) => <span className="tabular font-semibold">{formatBDT(row.original.total)}</span>,
    },
    {
      id: 'payment',
      header: t('orders.payment'),
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {paymentLabel(row.original.paymentMethod, t)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: t('products.status'),
      enableSorting: false,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const order = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={t('common.actions')}>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {canTransition(order.status, 'confirmed') ? (
                <DropdownMenuItem onClick={() => confirmOrder(order)}>
                  <CheckCircle2 className="size-4" />
                  {t('orders.confirmOrder')}
                </DropdownMenuItem>
              ) : null}
              {canTransition(order.status, 'rejected') ? (
                <DropdownMenuItem variant="destructive" onClick={() => setRejectOrder(order)}>
                  <XCircle className="size-4" />
                  {t('orders.rejectOrder')}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={`/orders/${order.id}`}>
                  <Eye className="size-4" />
                  {t('orders.viewDetails')}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('orders.title')}
        description={t('orders.subtitle')}
        actions={
          <span className="tabular rounded-full bg-[#FEF3C7] px-3 py-1 text-sm font-semibold text-[#D97706]">
            {t('orders.pendingBadge', { count: counts.pending ?? 0 })}
          </span>
        }
      />

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
        {(['all', ...ORDER_STATUSES] as const).map((entry) => {
          const isActive = status === entry
          const config = entry === 'all' ? null : ORDER_STATUS_CONFIG[entry]
          return (
            <button
              key={entry}
              type="button"
              onClick={() => setParam('status', entry === 'all' ? null : entry)}
              className={
                isActive
                  ? 'flex shrink-0 items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground'
                  : 'flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground'
              }
            >
              {config ? (
                <>
                  <span className="size-2 rounded-full" style={{ backgroundColor: config.color }} />
                  {lang === 'bn' ? config.labelBn : config.label}
                </>
              ) : (
                t('orders.all')
              )}
              <span
                className={
                  isActive
                    ? 'tabular rounded-full bg-primary-foreground/20 px-1.5 text-xs'
                    : 'tabular rounded-full bg-secondary px-1.5 text-xs'
                }
              >
                {counts[entry] ?? 0}
              </span>
            </button>
          )
        })}
      </div>

      <DataTable
        columns={columns}
        data={ordersQuery.data?.items ?? []}
        isLoading={ordersQuery.isLoading}
        getRowId={(order) => order.id}
        pagination={ordersQuery.data?.meta}
        onPageChange={(next) => setParam('page', String(next))}
        emptyTitle={t('orders.empty')}
        emptyDescription={t('orders.emptyHint')}
        toolbar={
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 lg:flex-row lg:items-center">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={t('orders.searchPlaceholder')}
                className="w-full sm:w-64"
              />
              <Input
                type="date"
                value={from}
                onChange={(event) => setParam('from', event.target.value || null)}
                className="w-40"
                aria-label={t('orders.from')}
              />
              <span className="text-xs text-muted-foreground">–</span>
              <Input
                type="date"
                value={to}
                onChange={(event) => setParam('to', event.target.value || null)}
                className="w-40"
                aria-label={t('orders.to')}
              />
              <Select value={zone} onValueChange={(value) => setParam('zone', value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t('orders.zone')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('orders.zone')}: {t('common.all')}</SelectItem>
                  <SelectItem value="inside_dhaka">{t('orders.insideDhaka')}</SelectItem>
                  <SelectItem value="outside_dhaka">{t('orders.outsideDhaka')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={payment} onValueChange={(value) => setParam('payment', value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t('orders.payment')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('orders.payment')}: {t('common.all')}</SelectItem>
                  <SelectItem value="cod">{t('orders.cod')}</SelectItem>
                  <SelectItem value="whatsapp">{t('orders.whatsapp')}</SelectItem>
                  <SelectItem value="messenger">{t('orders.messenger')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="text-xs text-muted-foreground">
              {t('orders.count', { count: ordersQuery.data?.meta.total ?? 0 })}
            </span>
          </div>
        }
      />

      <RejectOrderDialog
        order={rejectOrder}
        open={Boolean(rejectOrder)}
        onOpenChange={(open) => !open && setRejectOrder(null)}
      />
    </div>
  )
}
