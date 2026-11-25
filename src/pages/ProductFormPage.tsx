import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Link, useBeforeUnload, useBlocker, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ErrorState, PageLoader } from '@/components/shared/StateViews'
import { ImageUploader } from '@/components/products/ImageUploader'
import { NutritionTags } from '@/components/products/NutritionTags'
import { VariantsRepeater } from '@/components/products/VariantsRepeater'
import { useCategoriesQuery } from '@/hooks/queries/categories'
import { useProductBySlugQuery, useProductQuery } from '@/hooks/queries/products'
import {
  useCreateProductMutation,
  useUpdateProductMutation,
} from '@/hooks/mutations/products'
import { productSchema, type ProductFormValues } from '@/schemas/product.schema'
import { slugify } from '@/utils/slugify'
import type { ProductStatus } from '@/types'

const emptyVariant = { label: '', grams: 0, price: 0, mrp: 0, stock: 0, sku: '' }

const defaultValues: ProductFormValues = {
  nameBn: '',
  nameEn: '',
  slug: '',
  category: '',
  originBn: '',
  badgeBn: '',
  shortDescBn: '',
  fullDescBn: '',
  nutritionHighlights: [],
  images: [],
  weights: [emptyVariant],
  inStock: true,
  status: 'draft',
}

export default function ProductFormPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const productQuery = useProductQuery(isEdit ? id : undefined)
  const categoriesQuery = useCategoriesQuery()
  const createMutation = useCreateProductMutation()
  const updateMutation = useUpdateProductMutation()

  const [slugCheck, setSlugCheck] = useState('')
  const slugQuery = useProductBySlugQuery(slugCheck || undefined)
  const slugTaken = Boolean(slugQuery.data) && slugQuery.data?.id !== id

  const statusRef = useRef<ProductStatus>('draft')
  const slugTouched = useRef(false)
  const savedRef = useRef(false)
  const leavingRef = useRef(false)

  const isDirty = form.formState.isDirty
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !savedRef.current && isDirty && currentLocation.pathname !== nextLocation.pathname,
  )

  useBeforeUnload((event) => {
    if (!savedRef.current && form.formState.isDirty) {
      event.preventDefault()
      event.returnValue = ''
    }
  })

  useEffect(() => {
    const product = productQuery.data
    if (!product) return
    statusRef.current = product.status
    form.reset({
      nameBn: product.nameBn,
      nameEn: product.nameEn ?? '',
      slug: product.slug,
      category: product.category,
      originBn: product.originBn,
      badgeBn: product.badgeBn ?? '',
      shortDescBn: product.shortDescBn,
      fullDescBn: product.fullDescBn,
      nutritionHighlights: [...product.nutritionHighlights],
      images: [...product.images],
      weights: product.weights.map((weight) => ({ ...weight })),
      inStock: product.inStock,
      status: product.status,
    })
  }, [productQuery.data, form])

  const categories = categoriesQuery.data ?? []
  useEffect(() => {
    if (isEdit) return
    if (categories.length && !form.getValues('category')) {
      form.setValue('category', categories[0].slug)
    }
  }, [categories, form, isEdit])

  const nameEn = form.watch('nameEn')
  useEffect(() => {
    if (isEdit || !nameEn || slugTouched.current) return
    form.setValue('slug', slugify(nameEn), { shouldValidate: false })
  }, [nameEn, form, isEdit])

  const onSubmit = (values: ProductFormValues) => {
    const payload = {
      ...values,
      image: values.images[0] ?? '',
      status: statusRef.current,
    }
    const handleError = (error: unknown) => {
      const apiError = error as Error & { errors?: Record<string, string> }
      Object.entries(apiError.errors ?? {}).forEach(([field, message]) => {
        form.setError(field as keyof ProductFormValues, { message })
      })
      toast.error(apiError.message)
    }
    if (isEdit && id) {
      updateMutation.mutate(
        { id, payload },
        {
          onSuccess: () => {
            savedRef.current = true
            navigate('/products')
          },
          onError: handleError,
        },
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          savedRef.current = true
          navigate('/products')
        },
        onError: handleError,
      })
    }
  }

  const submitWithStatus = (status: ProductStatus) => {
    statusRef.current = status
    form.setValue('status', status)
    void form.handleSubmit(onSubmit)()
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  if (isEdit && productQuery.isLoading) {
    return <PageLoader />
  }

  if (isEdit && productQuery.isError) {
    return <ErrorState message={t('productForm.loadFailed')} onRetry={() => productQuery.refetch()} />
  }

  return (
    <div className="space-y-4 pb-24">
      <Link
        to="/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t('nav.products')}
      </Link>

      <div>
        <h1 className="font-serif text-2xl font-semibold sm:text-3xl">
          {isEdit ? t('productForm.editTitle') : t('productForm.newTitle')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('productForm.subtitle')}</p>
      </div>

      <Form {...form}>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit(onSubmit)()
          }}
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('productForm.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="nameBn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('productForm.nameBn')} *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nameEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('productForm.nameEn')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t('productForm.slug')} *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(event) => {
                          slugTouched.current = true
                          field.onChange(event)
                        }}
                        onBlur={() => {
                          field.onBlur()
                          setSlugCheck(form.getValues('slug'))
                        }}
                      />
                    </FormControl>
                    {slugCheck ? (
                      slugQuery.isFetching ? (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Loader2 className="size-3 animate-spin" />
                          {t('productForm.checking')}
                        </p>
                      ) : slugTaken ? (
                        <p className="flex items-center gap-1 text-xs text-destructive">
                          <XCircle className="size-3" />
                          {t('productForm.slugTaken')}
                        </p>
                      ) : (
                        <p className="flex items-center gap-1 text-xs text-[#16A34A]">
                          <CheckCircle2 className="size-3" />
                          {t('productForm.slugAvailable')}
                        </p>
                      )
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('productForm.category')} *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('productForm.category')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.slug}>
                            {i18n.language === 'bn' ? category.nameBn : category.nameEn}
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
                name="originBn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('productForm.origin')} *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="badgeBn"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t('productForm.badge')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="সেরা বিক্রিত" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('productForm.descriptions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="shortDescBn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('productForm.shortDesc')} *</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={160} />
                    </FormControl>
                    <FormDescription>{field.value.length}/160</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fullDescBn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('productForm.fullDesc')} *</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={5} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nutritionHighlights"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('productForm.nutrition')}</FormLabel>
                    <NutritionTags value={field.value} onChange={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('productForm.images')}</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <ImageUploader value={field.value} onChange={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('productForm.variants')}</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="weights"
                render={() => (
                  <FormItem>
                    <VariantsRepeater form={form} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('productForm.availability')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="inStock"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border p-3">
                    <div>
                      <FormLabel className="text-sm">{t('products.inStock')}</FormLabel>
                      <FormDescription>{t('productForm.availability')}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('products.status')}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">{t('products.draft')}</SelectItem>
                        <SelectItem value="active">{t('products.active')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur">
            <Button type="button" variant="ghost" asChild>
              <Link to="/products">{t('common.cancel')}</Link>
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={() => submitWithStatus('draft')}
              >
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                {t('productForm.saveDraft')}
              </Button>
              <Button type="button" disabled={isSaving} onClick={() => submitWithStatus('active')}>
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                {isEdit ? t('productForm.saveChanges') : t('productForm.publishProduct')}
              </Button>
            </div>
          </div>
        </form>
      </Form>

      <AlertDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => {
          if (!open && !leavingRef.current) blocker.reset?.()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('productForm.unsaved')}</AlertDialogTitle>
            <AlertDialogDescription>{t('productForm.unsavedDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('productForm.stay')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                leavingRef.current = true
                blocker.proceed?.()
              }}
            >
              {t('productForm.leave')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
