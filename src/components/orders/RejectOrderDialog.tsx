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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { REJECTION_REASONS } from '@/config/orderStatus'
import { useUpdateOrderStatusMutation } from '@/hooks/mutations/orders'
import { rejectOrderSchema, type RejectOrderValues } from '@/schemas/rejectOrder.schema'
import type { Order } from '@/types'

export function RejectOrderDialog({
  order,
  open,
  onOpenChange,
}: {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t, i18n } = useTranslation()
  const mutation = useUpdateOrderStatusMutation()
  const form = useForm<RejectOrderValues>({
    resolver: zodResolver(rejectOrderSchema),
    defaultValues: { reason: '', feedback: '' },
  })

  useEffect(() => {
    if (open) form.reset({ reason: '', feedback: '' })
  }, [open, form])

  const onSubmit = (values: RejectOrderValues) => {
    if (!order) return
    mutation.mutate(
      { id: order.id, status: 'rejected', reason: values.reason, feedback: values.feedback },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('orderDetails.rejectTitle')}</DialogTitle>
          <DialogDescription>{t('orderDetails.rejectDesc')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('orderDetails.reason')} *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('orderDetails.reason')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {REJECTION_REASONS.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {i18n.language === 'bn' ? reason.labelBn : reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('orderDetails.feedback')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} placeholder={t('orderDetails.feedbackPlaceholder')} />
                  </FormControl>
                  <FormDescription>{t('orderDetails.feedbackPlaceholder')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="destructive" disabled={mutation.isPending}>
                {t('orderDetails.confirmReject')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
