import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, EyeOff, Star, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/StateViews'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useReviewsQuery } from '@/hooks/queries/reviews'
import { useDeleteReviewMutation, useUpdateReviewMutation } from '@/hooks/mutations/reviews'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/date'
import type { Review, ReviewStatus } from '@/types'

const tabs: Array<ReviewStatus | 'all'> = ['pending', 'approved', 'hidden', 'all']

const reviewStatusStyles: Record<ReviewStatus, string> = {
  pending: 'bg-[#FEF3C7] text-[#B45309]',
  approved: 'bg-[#DCFCE7] text-[#15803D]',
  hidden: 'bg-secondary text-muted-foreground',
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} / 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            'size-3.5',
            index < rating ? 'fill-[#D97706] text-[#D97706]' : 'text-border',
          )}
        />
      ))}
    </span>
  )
}

export default function ReviewsPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'bn' ? 'bn' : 'en'
  const [status, setStatus] = useState<ReviewStatus | 'all'>('pending')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null)
  const debouncedSearch = useDebouncedValue(search, 350)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status])

  const reviewsQuery = useReviewsQuery({
    status,
    search: debouncedSearch || undefined,
    page,
    limit: 6,
  })
  const countsQuery = useReviewsQuery({ status: 'all', page: 1, limit: 100 })
  const updateMutation = useUpdateReviewMutation()
  const deleteMutation = useDeleteReviewMutation()

  const counts = useMemo(() => {
    const items = countsQuery.data?.items ?? []
    const map: Record<string, number> = { all: items.length }
    items.forEach((review) => {
      map[review.status] = (map[review.status] ?? 0) + 1
    })
    return map
  }, [countsQuery.data])

  const reviews = reviewsQuery.data?.items ?? []
  const meta = reviewsQuery.data?.meta
  const tabLabels: Record<string, string> = {
    pending: t('reviews.pending'),
    approved: t('reviews.approved'),
    hidden: t('reviews.hidden'),
    all: t('reviews.all'),
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('reviews.title')}
        description={t('reviews.subtitle')}
        actions={
          <span className="tabular rounded-full bg-[#FEF3C7] px-3 py-1 text-sm font-semibold text-[#D97706]">
            {t('reviews.count', { count: counts.pending ?? 0 })}
          </span>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg bg-secondary p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatus(tab)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                status === tab
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tabLabels[tab]}
              <span className="tabular rounded-full bg-secondary px-1.5 text-[10px]">
                {counts[tab] ?? 0}
              </span>
            </button>
          ))}
        </div>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('reviews.searchPlaceholder')}
          className="w-full sm:w-72"
        />
      </div>

      {reviewsQuery.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState title={t('reviews.empty')} />
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{review.author}</span>
                      <RatingStars rating={review.rating} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {review.productNameBn || t('reviews.noProduct')} ·{' '}
                      {formatDate(review.createdAt, 'dd MMM yyyy', lang)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                      reviewStatusStyles[review.status],
                    )}
                  >
                    {tabLabels[review.status]}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">{review.text}</p>
                <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                  {review.status !== 'approved' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateMutation.mutate({ id: review.id, status: 'approved' })}
                    >
                      <Check className="size-4 text-[#16A34A]" />
                      {t('reviews.approve')}
                    </Button>
                  ) : null}
                  {review.status !== 'hidden' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateMutation.mutate({ id: review.id, status: 'hidden' })}
                    >
                      <EyeOff className="size-4" />
                      {t('reviews.hide')}
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(review)}
                  >
                    <Trash2 className="size-4" />
                    {t('reviews.delete')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-xs text-muted-foreground">
            {t('common.page')} {meta.page} {t('common.of')} {meta.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              {t('common.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage((current) => Math.min(meta.totalPages, current + 1))}
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('reviews.deleteTitle')}
        description={t('reviews.deleteDesc')}
        confirmText={t('reviews.delete')}
        destructive
        onConfirm={() => {
          if (!deleteTarget) return
          deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
        }}
      />
    </div>
  )
}
