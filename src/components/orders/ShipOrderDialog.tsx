import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useUpdateOrderStatusMutation } from '@/hooks/mutations/orders'
import { courierSchema, type CourierValues } from '@/schemas/rejectOrder.schema'
import type { Order } from '@/types'

export function ShipOrderDialog({
  order,
  open,
  onOpenChange,
}: {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const mutation = useUpdateOrderStatusMutation()
  const form = useForm<CourierValues>({
    resolver: zodResolver(courierSchema),
    defaultValues: { name: '', trackingId: '' },
  })

  useEffect(() => {
    if (open) form.reset({ name: 'Pathao', trackingId: '' })
  }, [open, form])

  const onSubmit = (values: CourierValues) => {
    if (!order) return
    mutation.mutate(
      { id: order.id, status: 'shipped', courier: values.name, trackingId: values.trackingId },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('orderDetails.markShipped')}</DialogTitle>
          <DialogDescription>{t('orderDetails.courier')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('orderDetails.courierName')} *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Pathao / Steadfast / RedX" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="trackingId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('orderDetails.trackingId')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {t('orderDetails.confirmShipment')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
