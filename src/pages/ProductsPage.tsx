import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Copy,
  ExternalLink,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
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
import { env } from '@/config/env'
import { useCategoriesQuery } from '@/hooks/queries/categories'
import { useProductsQuery } from '@/hooks/queries/products'
import { useSettingsQuery } from '@/hooks/queries/settings'
import {
  useBulkProductsMutation,
  useCreateProductMutation,
  useDeleteProductMutation,
} from '@/hooks/mutations/products'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatBDT } from '@/utils/format'
import { parsePage } from '@/utils/query'
import { uniqueSlug } from '@/utils/slugify'
import type { AdminProduct, ProductFilters } from '@/types'

export default function ProductsPage() {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const category = searchParams.get('category') ?? 'all'
  const stock = (searchParams.get('stock') as ProductFilters['stock']) ?? 'all'
  const status = (searchParams.get('status') as ProductFilters['status']) ?? 'all'
  const sort = (searchParams.get('sort') as ProductFilters['sort']) ?? 'newest'
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

  const filters: ProductFilters = {
    category: category === 'all' ? undefined : category,
    search: search || undefined,
    stock,
    status,
    sort,
    page,
    limit: 10,
  }

  const productsQuery = useProductsQuery(filters)
  const allProductsQuery = useProductsQuery({ page: 1, limit: 100 })
  const categoriesQuery = useCategoriesQuery()
  const settingsQuery = useSettingsQuery()
  const threshold = settingsQuery.data?.lowStockThreshold ?? 10

  const createMutation = useCreateProductMutation()
  const deleteMutation = useDeleteProductMutation()
  const bulkMutation = useBulkProductsMutation()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const categories = categoriesQuery.data ?? []
  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((entry) => [entry.slug, entry])),
    [categories],
  )

  const counts = useMemo(() => {
    const items = allProductsQuery.data?.items ?? []
    const map: Record<string, number> = { all: items.length }
    items.forEach((product) => {
      map[product.category] = (map[product.category] ?? 0) + 1
    })
    return map
  }, [allProductsQuery.data])

  const duplicateProduct = (product: AdminProduct) => {
    const existingSlugs = (allProductsQuery.data?.items ?? []).map((entry) => entry.slug)
    const payload = {
      slug: uniqueSlug(`${product.slug}-copy`, existingSlugs),
      nameBn: `${product.nameBn} (কপি)`,
      nameEn: product.nameEn ? `${product.nameEn} (Copy)` : undefined,
      category: product.category,
      originBn: product.originBn,
      image: product.image,
      images: [...product.images],
      badgeBn: product.badgeBn,
      inStock: product.inStock,
      status: 'draft' as const,
      shortDescBn: product.shortDescBn,
      fullDescBn: product.fullDescBn,
      nutritionHighlights: [...product.nutritionHighlights],
      weights: product.weights.map((weight) => ({ ...weight, stock: 0 })),
    }
    createMutation.mutate(payload, {
      onSuccess: () => toast.success(t('products.duplicated')),
    })
  }

  const columns: ColumnDef<AdminProduct>[] = [
    {
      accessorKey: 'image',
      header: t('products.image'),
      enableSorting: false,
      cell: ({ row }) => (
        <img
          src={row.original.image}
          alt={row.original.nameBn}
          className="size-10 rounded-lg border border-border object-cover"
        />
      ),
    },
    {
      accessorKey: 'nameBn',
      header: t('products.name'),
      cell: ({ row }) => (
        <div className="min-w-40">
          <p className="font-medium text-foreground">{row.original.nameBn}</p>
          <p className="tabular text-xs text-muted-foreground">/{row.original.slug}</p>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: t('products.category'),
      enableSorting: false,
      cell: ({ row }) => {
        const entry = categoryMap[row.original.category]
        return (
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
            {entry ? (i18n.language === 'bn' ? entry.nameBn : entry.nameEn) : row.original.category}
          </span>
        )
      },
    },
    {
      accessorKey: 'originBn',
      header: t('products.origin'),
      enableSorting: false,
    },
    {
      id: 'price',
      header: t('products.priceRange'),
      cell: ({ row }) => {
        const prices = row.original.weights.map((weight) => weight.price)
        const min = Math.min(...prices)
        const max = Math.max(...prices)
        return (
          <span className="tabular whitespace-nowrap">
            {min === max ? formatBDT(min) : `${formatBDT(min)} – ${formatBDT(max)}`}
          </span>
        )
      },
    },
    {
      id: 'stock',
      header: t('products.totalStock'),
      cell: ({ row }) => {
        const total = row.original.weights.reduce((sum, weight) => sum + weight.stock, 0)
        const tone =
          total === 0
            ? 'text-destructive'
            : total <= threshold
              ? 'text-[#D97706]'
              : 'text-foreground'
        return <span className={`tabular font-medium ${tone}`}>{total}</span>
      },
    },
    {
      accessorKey: 'status',
      header: t('products.status'),
      enableSorting: false,
      cell: ({ row }) => (
        <span
          className={
            row.original.status === 'active'
              ? 'inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-2.5 py-1 text-xs font-medium text-[#16A34A]'
              : 'inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground'
          }
        >
          <span className="size-1.5 rounded-full bg-current" />
          {row.original.status === 'active' ? t('products.active') : t('products.draft')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const product = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={t('common.actions')}>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to={`/products/${product.id}/edit`}>
                  <Pencil className="size-4" />
                  {t('common.edit')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => duplicateProduct(product)}>
                <Copy className="size-4" />
                {t('common.duplicate')}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href={`${env.storefrontUrl}/products/${product.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="size-4" />
                  {t('common.viewOnStore')}
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(product)}>
                <Trash2 className="size-4" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const meta = productsQuery.data?.meta
  const hasSelection = selectedIds.length > 0

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('products.title')}
        description={t('products.subtitle')}
        actions={
          <Button asChild>
            <Link to="/products/new">
              <Plus className="size-4" />
              {t('products.addProduct')}
            </Link>
          </Button>
        }
      />

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
        {[{ slug: 'all', nameEn: t('common.all'), nameBn: t('common.all') }, ...categories].map(
          (entry) => {
            const key = entry.slug
            const isActive = category === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setParam('category', key === 'all' ? null : key)}
                className={
                  isActive
                    ? 'flex shrink-0 items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground'
                    : 'flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground'
                }
              >
                {i18n.language === 'bn' ? entry.nameBn : entry.nameEn}
                <span
                  className={
                    isActive
                      ? 'tabular rounded-full bg-primary-foreground/20 px-1.5 text-xs'
                      : 'tabular rounded-full bg-secondary px-1.5 text-xs'
                  }
                >
                  {counts[key] ?? 0}
                </span>
              </button>
            )
          },
        )}
      </div>

      <DataTable
        columns={columns}
        data={productsQuery.data?.items ?? []}
        isLoading={productsQuery.isLoading}
        getRowId={(product) => product.id}
        pagination={meta}
        onPageChange={(next) => setParam('page', String(next))}
        enableSelection
        onSelectionChange={setSelectedIds}
        emptyTitle={t('products.empty')}
        emptyDescription={t('products.emptyHint')}
        emptyAction={
          <Button asChild variant="outline" size="sm">
            <Link to="/products/new">
              <Plus className="size-4" />
              {t('products.addProduct')}
            </Link>
          </Button>
        }
        toolbar={
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 lg:flex-row lg:items-center">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={t('products.searchPlaceholder')}
                className="w-full sm:w-64"
              />
              <Select value={stock} onValueChange={(value) => setParam('stock', value)}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder={t('products.stock')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('products.stock')}: {t('common.all')}</SelectItem>
                  <SelectItem value="in">{t('products.inStock')}</SelectItem>
                  <SelectItem value="low">{t('products.lowStock')}</SelectItem>
                  <SelectItem value="out">{t('products.outOfStock')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(value) => setParam('status', value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder={t('products.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('products.status')}: {t('common.all')}</SelectItem>
                  <SelectItem value="active">{t('products.active')}</SelectItem>
                  <SelectItem value="draft">{t('products.draft')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(value) => setParam('sort', value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder={t('products.sort')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t('products.newest')}</SelectItem>
                  <SelectItem value="name">{t('products.nameAZ')}</SelectItem>
                  <SelectItem value="price">{t('products.price')}</SelectItem>
                  <SelectItem value="stock">{t('products.stockSort')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasSelection ? (
              <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2 lg:border-l lg:border-t-0 lg:pl-3 lg:pt-0">
                <span className="text-xs text-muted-foreground">
                  {t('common.rowsSelected', { count: selectedIds.length })}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkMutation.mutate({ action: 'publish', ids: selectedIds })}
                >
                  {t('products.bulkPublish')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkMutation.mutate({ action: 'unpublish', ids: selectedIds })}
                >
                  {t('products.bulkUnpublish')}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
                  <Trash2 className="size-4" />
                  {t('products.bulkDelete')}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Package className="size-4" />
                {t('products.count', { count: meta?.total ?? 0 })}
              </div>
            )}
          </div>
        }
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('products.deleteTitle')}
        description={t('products.deleteDesc', { name: deleteTarget?.nameBn ?? '' })}
        confirmText={t('products.deleteConfirm')}
        destructive
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
        }}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={t('products.deleteTitle')}
        description={t('common.rowsSelected', { count: selectedIds.length })}
        confirmText={t('products.bulkDelete')}
        destructive
        onConfirm={() => bulkMutation.mutate({ action: 'delete', ids: selectedIds })}
      />
    </div>
  )
}
