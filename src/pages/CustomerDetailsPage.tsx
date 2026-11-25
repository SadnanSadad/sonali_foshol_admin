import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Flag, MapPin, MessageCircle, Phone, ShoppingBag } from 'lucide-react'
import { ErrorState, PageLoader } from '@/components/shared/StateViews'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useCustomerOrdersQuery, useCustomerQuery } from '@/hooks/queries/customers'
import { useFlagCustomerMutation } from '@/hooks/mutations/customers'
import { formatDate } from '@/utils/date'
import { formatBDT } from '@/utils/format'
import { buildWhatsAppLink } from '@/utils/whatsapp'

export default function CustomerDetailsPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'bn' ? 'bn' : 'en'
  const { customerId } = useParams()
  const customerQuery = useCustomerQuery(customerId)
  const ordersQuery = useCustomerOrdersQuery(customerId)
  const flagMutation = useFlagCustomerMutation()

  const customer = customerQuery.data

  if (customerQuery.isLoading) return <PageLoader />
  if (customerQuery.isError || !customer) {
    return <ErrorState message={t('customers.notFound')} onRetry={() => customerQuery.refetch()} />
  }

  const orders = ordersQuery.data ?? []

  return (
    <div className="space-y-4">
      <Link
        to="/customers"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t('customers.back')}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 font-serif text-lg font-semibold text-primary">
            {customer.name.slice(0, 1)}
          </span>
          <div>
            <h1 className="font-serif text-2xl font-semibold">{customer.name}</h1>
            <p className="tabular text-sm text-muted-foreground">{customer.phone}</p>
          </div>
          {customer.flagged ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FEE2E2] px-2.5 py-1 text-xs font-semibold text-[#DC2626]">
              <Flag className="size-3" />
              {t('customers.risky')}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <span className="text-sm text-muted-foreground">{t('customers.flag')}</span>
          <Switch
            checked={customer.flagged}
            onCheckedChange={(value) =>
              flagMutation.mutate({ id: customer.id, flagged: value })
            }
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="space-y-3 pt-6 text-sm">
            <div className="flex items-center gap-2">
              <ShoppingBag className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t('customers.orders')}</span>
              <span className="tabular ml-auto font-semibold">{customer.orderCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{t('customers.totalSpent')}</span>
              <span className="tabular ml-auto font-semibold">{formatBDT(customer.totalSpent)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{t('customers.joined')}</span>
              <span className="ml-auto text-xs">
                {formatDate(customer.createdAt, 'dd MMM yyyy', lang)}
              </span>
            </div>
            <div className="flex items-start gap-2 border-t border-border pt-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">{customer.district}</p>
                <p className="text-xs text-muted-foreground">{customer.address}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild variant="outline" size="sm">
                <a href={`tel:${customer.phone}`}>
                  <Phone className="size-4" />
                  {t('orderDetails.call')}
                </a>
              </Button>
              <Button asChild size="sm">
                <a
                  href={buildWhatsAppLink(
                    customer.phone,
                    `আসসালামু আলাইকুম ${customer.name}, সোনালী ফসল অর্গানিকস থেকে বলছি।`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="size-4" />
                  {t('orders.whatsapp')}
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t('customers.history')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {ordersQuery.isLoading ? (
              <p className="p-6 text-sm text-muted-foreground">{t('common.loading')}</p>
            ) : orders.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">{t('customers.noOrders')}</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('orders.orderId')}</TableHead>
                      <TableHead>{t('orders.date')}</TableHead>
                      <TableHead>{t('orders.items')}</TableHead>
                      <TableHead className="text-right">{t('orders.total')}</TableHead>
                      <TableHead>{t('products.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Link
                            to={`/orders/${order.id}`}
                            className="tabular font-medium hover:text-primary"
                          >
                            {order.orderNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(order.createdAt, 'dd MMM yyyy', lang)}
                        </TableCell>
                        <TableCell className="tabular">
                          {order.items.reduce((sum, item) => sum + item.qty, 0)}
                        </TableCell>
                        <TableCell className="tabular text-right font-medium">
                          {formatBDT(order.total)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
