import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { RotateCcw, Save } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorState, PageLoader } from '@/components/shared/StateViews'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useSettingsQuery } from '@/hooks/queries/settings'
import { useResetDemoDataMutation, useUpdateSettingsMutation } from '@/hooks/mutations/settings'
import { settingsSchema, type SettingsFormValues } from '@/schemas/settings.schema'

export default function SettingsPage() {
  const { t } = useTranslation()
  const settingsQuery = useSettingsQuery()
  const updateMutation = useUpdateSettingsMutation()
  const resetMutation = useResetDemoDataMutation()
  const [resetOpen, setResetOpen] = useState(false)

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      storeName: '',
      storeNameBn: '',
      whatsappNumber: '',
      facebookUrl: '',
      messengerUrl: '',
      deliveryFeeInside: 0,
      deliveryFeeOutside: 0,
      freeShippingThreshold: 0,
      lowStockThreshold: 5,
    },
  })

  useEffect(() => {
    if (settingsQuery.data) form.reset(settingsQuery.data)
  }, [settingsQuery.data, form])

  const onSubmit = (values: SettingsFormValues) => {
    updateMutation.mutate(values, {
      onSuccess: (saved) => form.reset(saved),
    })
  }

  if (settingsQuery.isLoading) return <PageLoader />
  if (settingsQuery.isError) {
    return <ErrorState message={t('errors.loadFailed')} onRetry={() => settingsQuery.refetch()} />
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t('settings.title')} description={t('settings.subtitle')} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('settings.storeInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="storeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.storeName')} *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="storeNameBn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.storeNameBn')} *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsappNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.whatsapp')} *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+8801XXXXXXXXX" className="tabular" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="facebookUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.facebook')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://facebook.com/…" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="messengerUrl"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t('settings.messenger')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://m.me/…" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('settings.delivery')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField
                control={form.control}
                name="deliveryFeeInside"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.insideFee')}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} className="tabular" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deliveryFeeOutside"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.outsideFee')}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} className="tabular" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="freeShippingThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.freeShipping')}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} className="tabular" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lowStockThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.lowStock')}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} className="tabular" />
                    </FormControl>
                    <FormDescription>{t('dashboard.lowStock')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending}>
              <Save className="size-4" />
              {t('settings.saveSettings')}
            </Button>
          </div>
        </form>
      </Form>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">{t('settings.resetDemo')}</CardTitle>
          <CardDescription>{t('settings.resetDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setResetOpen(true)}>
            <RotateCcw className="size-4" />
            {t('settings.resetDemo')}
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title={t('settings.resetTitle')}
        description={t('settings.resetDesc')}
        confirmText={t('settings.resetConfirm')}
        destructive
        onConfirm={() => {
          resetMutation.mutate(undefined, {
            onSuccess: () => {
              setResetOpen(false)
              void settingsQuery.refetch()
            },
          })
        }}
      />
    </div>
  )
}
