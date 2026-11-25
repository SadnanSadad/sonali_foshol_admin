import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Phone,
  Printer,
  Truck,
  User,
  XCircle,
} from 'lucide-react'
import { PageLoader, ErrorState } from '@/components/shared/StateViews'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { RejectOrderDialog } from '@/components/orders/RejectOrderDialog'
import { ShipOrderDialog } from '@/components/orders/ShipOrderDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ORDER_STATUS_CONFIG,
  ORDER_STATUS_ORDER,
  canTransition,
  rejectionReasonLabel,
  rejectionReasonLabelBn,
} from '@/config/orderStatus'
import { useOrderQuery } from '@/hooks/queries/orders'
import { useUpdateOrderStatusMutation } from '@/hooks/mutations/orders'
import { formatDate, formatDateTime } from '@/utils/date'
import { formatBDT } from '@/utils/format'
import { buildWhatsAppLink, orderWhatsAppMessage } from '@/utils/whatsapp'
import type { Order } from '@/types'

const paymentKeys: Record<string, string> = {
  cod: 'orders.cod',
  whatsapp: 'orders.whatsapp',
  messenger: 'orders.messenger',
}

function StatusTimeline({ order }: { order: Order }) {
  const { i18n } = useTranslation()
  const lang = i18n.language === 'bn' ? 'bn' : 'en'
  const stopped = order.status === 'rejected' || order.status === 'cancelled'
  const normalSteps = order.statusHistory
    .map((entry) => ORDER_STATUS_CONFIG[entry.status].step)
    .filter((step) => step >= 0)
  const lastNormalStep = stopped
    ? Math.max(0, ...normalSteps)
    : ORDER_STATUS_CONFIG[order.status].step

  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:items-start sm:justify-between">
      {ORDER_STATUS_ORDER.map((status, index) => {
        const config = ORDER_STATUS_CONFIG[status]
        const entry = [...order.statusHistory].reverse().find((history) => history.status === status)
        const done = index <= lastNormalStep
        const future = index > lastNormalStep
        const rejectedFuture = stopped && future
        const Icon = config.icon
        return (
          <li key={status} className="relative flex flex-1 gap-3 sm:flex-col sm:items-center sm:gap-2 sm:text-center">
            {index < ORDER_STATUS_ORDER.length - 1 ? (
              <span
                className={
                  rejectedFuture
                    ? 'absolute left-[15px] top-7 h-full w-0.5 bg-[#FCA5A5] sm:left-auto sm:top-[15px] sm:h-0.5 sm:w-full sm:translate-x-[50%]'
                    : 'absolute left-[15px] top-7 h-full w-0.5 bg-border sm:left-auto sm:top-[15px] sm:h-0.5 sm:w-full sm:translate-x-[50%]'
                }
                aria-hidden
              />
            ) : null}
            <span
              className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2"
              style={{
                borderColor: done ? config.color : rejectedFuture ? '#DC2626' : 'var(--border)',
                backgroundColor: done ? config.color : 'var(--card)',
                color: done ? '#FFFFFF' : rejectedFuture ? '#DC2626' : 'var(--muted-foreground)',
              }}
            >
              <Icon className="size-4" />
            </span>
            <div className="pb-3 sm:pb-0">
              <p
                className={
                  rejectedFuture
                    ? 'text-xs font-medium text-destructive line-through'
                    : done
                      ? 'text-xs font-semibold text-foreground'
                      : 'text-xs font-medium text-muted-foreground'
                }
              >
                {lang === 'bn' ? config.labelBn : config.label}
              </p>
              {entry ? (
                <p className="text-[10px] text-muted-foreground">
                  {formatDate(entry.at, 'dd MMM, hh:mm a', lang)}
                </p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default function OrderDetailsPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'bn' ? 'bn' : 'en'
  const { orderId } = useParams()
  const orderQuery = useOrderQuery(orderId)
  const mutation = useUpdateOrderStatusMutation()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [shipOpen, setShipOpen] = useState(false)

  const order = orderQuery.data

  if (orderQuery.isLoading) return <PageLoader />
  if (orderQuery.isError || !order) {
    return <ErrorState message={t('orderDetails.notFound')} onRetry={() => orderQuery.refetch()} />
  }

  const readOnly = ['delivered', 'rejected', 'cancelled'].includes(order.status)
  const itemsCount = order.items.reduce((sum, item) => sum + item.qty, 0)

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <Link
          to="/orders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t('orderDetails.backToOrders')}
        </Link>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="size-4" />
          {t('orderDetails.printInvoice')}
        </Button>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="tabular font-serif text-2xl font-semibold sm:text-3xl">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('orderDetails.placedOn')}{' '}
            {formatDateTime(order.createdAt, lang)} · {itemsCount} {t('orders.items')}
          </p>
        </div>
        <StatusBadge status={order.status} className="text-sm" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('orderDetails.timeline')}</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline order={order} />
              {order.expectedDeliveryDate ? (
                <p className="mt-4 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
                  {t('orderDetails.expectedDelivery')}:{' '}
                  <span className="font-medium text-foreground">
                    {formatDate(order.expectedDeliveryDate, 'dd MMM yyyy', lang)}
                  </span>
                </p>
              ) : null}
            </CardContent>
          </Card>

          {order.status === 'rejected' && order.rejection ? (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                <XCircle className="size-4 text-destructive" />
                <CardTitle className="text-base text-destructive">{t('orderDetails.rejection')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t('orderDetails.rejectionReason')}
                  </p>
                  <p className="font-medium">
                    {lang === 'bn'
                      ? rejectionReasonLabelBn(order.rejection.reason)
                      : rejectionReasonLabel(order.rejection.reason)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t('orderDetails.rejectionFeedback')}
                  </p>
                  <p>{order.rejection.feedback || '—'}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('orderDetails.rejectedBy')}: {order.rejection.by} ·{' '}
                  {formatDateTime(order.rejection.at, lang)}
                </p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('orderDetails.itemsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('orderDetails.product')}</TableHead>
                      <TableHead>{t('orderDetails.weight')}</TableHead>
                      <TableHead className="text-right">{t('orderDetails.unitPrice')}</TableHead>
                      <TableHead className="text-right">{t('orderDetails.qty')}</TableHead>
                      <TableHead className="text-right">{t('orderDetails.lineTotal')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={`${item.productId}-${item.weightLabel}`}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="size-10 rounded-lg border border-border object-cover"
                            />
                            <span className="font-medium">{item.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>{item.weightLabel}</TableCell>
                        <TableCell className="tabular text-right">{formatBDT(item.unitPrice)}</TableCell>
                        <TableCell className="tabular text-right">{item.qty}</TableCell>
                        <TableCell className="tabular text-right font-semibold">
                          {formatBDT(item.unitPrice * item.qty)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('orderDetails.activity')}</CardTitle>
            </CardHeader>
            <CardContent>
              {order.statusHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('orderDetails.emptyHistory')}</p>
              ) : (
                <ol className="space-y-3">
                  {[...order.statusHistory].reverse().map((entry, index) => {
                    const config = ORDER_STATUS_CONFIG[entry.status]
                    return (
                      <li key={`${entry.status}-${entry.at}-${index}`} className="flex gap-3">
                        <span
                          className="mt-1 size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: config.color }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {lang === 'bn' ? config.labelBn : config.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(entry.at, lang)} · {entry.by}
                          </p>
                          {entry.note ? (
                            <p className="mt-0.5 text-xs text-muted-foreground">{entry.note}</p>
                          ) : null}
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('orderDetails.summary')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('orderDetails.subtotal')}</span>
                <span className="tabular">{formatBDT(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('orderDetails.deliveryFee')}</span>
                <span className="tabular">{formatBDT(order.deliveryFee)}</span>
              </div>
              {order.discount > 0 ? (
                <div className="flex justify-between text-[#16A34A]">
                  <span>{t('orderDetails.discount')}</span>
                  <span className="tabular">−{formatBDT(order.discount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                <span>{t('orderDetails.grandTotal')}</span>
                <span className="tabular">{formatBDT(order.total)}</span>
              </div>
              <div className="flex justify-between pt-1 text-xs text-muted-foreground">
                <span>{t('orderDetails.paymentMethod')}</span>
                <span className="font-medium text-foreground">{t(paymentKeys[order.paymentMethod])}</span>
              </div>
              {order.paymentMethod === 'cod' ? (
                <div className="flex justify-between rounded-lg bg-secondary/60 px-2.5 py-2 text-xs">
                  <span className="text-muted-foreground">{t('orderDetails.codAmount')}</span>
                  <span className="tabular font-semibold">{formatBDT(order.total)}</span>
                </div>
              ) : null}
              {order.courier ? (
                <div className="flex justify-between pt-1 text-xs text-muted-foreground">
                  <span>{t('orderDetails.courier')}</span>
                  <span className="font-medium text-foreground">
                    {order.courier.name}
                    {order.courier.trackingId ? ` · ${order.courier.trackingId}` : ''}
                  </span>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('orderDetails.customerCard')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <span className="font-medium">{order.customer.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-4 text-muted-foreground" />
                <a href={`tel:${order.customer.phone}`} className="tabular hover:text-primary">
                  {order.customer.phone}
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium">{order.customer.district}</p>
                  <p className="text-xs text-muted-foreground">{order.customer.address}</p>
                </div>
              </div>
              {order.customer.note ? (
                <p className="rounded-lg bg-secondary/60 px-2.5 py-2 text-xs text-muted-foreground">
                  {t('orderDetails.note')}: {order.customer.note}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild variant="outline" size="sm">
                  <a href={`tel:${order.customer.phone}`}>
                    <Phone className="size-4" />
                    {t('orderDetails.call')}
                  </a>
                </Button>
                <Button asChild size="sm">
                  <a
                    href={buildWhatsAppLink(
                      order.customer.phone,
                      orderWhatsAppMessage(order.orderNumber, order.customer.name),
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="size-4" />
                    {t('orderDetails.openWhatsApp')}
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="no-print">
            <CardHeader>
              <CardTitle className="text-base">{t('orderDetails.actions')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {readOnly ? (
                <p className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
                  {t('orderDetails.readOnly', {
                    status:
                      lang === 'bn'
                        ? ORDER_STATUS_CONFIG[order.status].labelBn
                        : ORDER_STATUS_CONFIG[order.status].label,
                  })}
                </p>
              ) : null}

              {canTransition(order.status, 'confirmed') ? (
                <Button onClick={() => mutation.mutate({ id: order.id, status: 'confirmed' })}>
                  <CheckCircle2 className="size-4" />
                  {t('orderDetails.confirmOrder')}
                </Button>
              ) : null}
              {canTransition(order.status, 'processing') ? (
                <Button onClick={() => mutation.mutate({ id: order.id, status: 'processing' })}>
                  {t('orderDetails.startProcessing')}
                </Button>
              ) : null}
              {canTransition(order.status, 'shipped') ? (
                <Button onClick={() => setShipOpen(true)}>
                  <Truck className="size-4" />
                  {t('orderDetails.markShipped')}
                </Button>
              ) : null}
              {canTransition(order.status, 'delivered') ? (
                <Button onClick={() => mutation.mutate({ id: order.id, status: 'delivered' })}>
                  <CheckCircle2 className="size-4" />
                  {t('orderDetails.markDelivered')}
                </Button>
              ) : null}
              {canTransition(order.status, 'rejected') ? (
                <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                  <XCircle className="size-4" />
                  {t('orderDetails.rejectOrder')}
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <RejectOrderDialog order={order} open={rejectOpen} onOpenChange={setRejectOpen} />
      <ShipOrderDialog order={order} open={shipOpen} onOpenChange={setShipOpen} />
    </div>
  )
}
