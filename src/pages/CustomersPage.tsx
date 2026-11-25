import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { Flag } from 'lucide-react'
import { DataTable } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useCustomersQuery } from '@/hooks/queries/customers'
import { useFlagCustomerMutation } from '@/hooks/mutations/customers'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/date'
import { formatBDT } from '@/utils/format'
import type { Customer, CustomerFilters } from '@/types'

const flagOptions: Array<CustomerFilters['flagged']> = ['all', 'yes', 'no']

export default function CustomersPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'bn' ? 'bn' : 'en'
  const [search, setSearch] = useState('')
  const [flagged, setFlagged] = useState<CustomerFilters['flagged']>('all')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search, 350)
  const flagMutation = useFlagCustomerMutation()

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, flagged])

  const customersQuery = useCustomersQuery({
    search: debouncedSearch || undefined,
    flagged,
    page,
    limit: 10,
  })

  const columns: ColumnDef<Customer>[] = [
    {
      id: 'name',
      header: t('customers.name'),
      cell: ({ row }) => (
        <div>
          <Link
            to={`/customers/${row.original.id}`}
            className="font-medium hover:text-primary"
          >
            {row.original.name}
          </Link>
          <p className="tabular text-xs text-muted-foreground">{row.original.phone}</p>
        </div>
      ),
    },
    {
      accessorKey: 'district',
      header: t('customers.district'),
    },
    {
      accessorKey: 'orderCount',
      header: t('customers.orders'),
      cell: ({ row }) => <span className="tabular">{row.original.orderCount}</span>,
    },
    {
      accessorKey: 'totalSpent',
      header: t('customers.totalSpent'),
      cell: ({ row }) => (
        <span className="tabular font-semibold">{formatBDT(row.original.totalSpent)}</span>
      ),
    },
    {
      id: 'lastOrder',
      header: t('customers.lastOrder'),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.lastOrderAt ? formatDate(row.original.lastOrderAt, 'dd MMM yyyy', lang) : '—'}
        </span>
      ),
    },
    {
      id: 'flagged',
      header: t('customers.flagged'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.original.flagged}
            onCheckedChange={(value) =>
              flagMutation.mutate({ id: row.original.id, flagged: value })
            }
            aria-label={t('customers.flag')}
          />
          {row.original.flagged ? (
            <Flag className="size-3.5 text-[#DC2626]" aria-hidden />
          ) : null}
        </div>
      ),
    },
  ]

  const flagLabels: Record<string, string> = {
    all: t('customers.filterAll'),
    yes: t('customers.filterFlagged'),
    no: t('customers.filterClean'),
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t('customers.title')} description={t('customers.subtitle')} />

      <DataTable
        columns={columns}
        data={customersQuery.data?.items ?? []}
        isLoading={customersQuery.isLoading}
        getRowId={(customer) => customer.id}
        pagination={customersQuery.data?.meta}
        onPageChange={setPage}
        emptyTitle={t('customers.empty')}
        toolbar={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('customers.searchPlaceholder')}
              className="w-full sm:w-72"
            />
            <div className="flex gap-1 rounded-lg bg-secondary p-1">
              {flagOptions.map((option) => {
                const value = option ?? 'all'
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFlagged(value)}
                    className={cn(
                      'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                      flagged === value
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {flagLabels[value]}
                  </button>
                )
              })}
            </div>
          </div>
        }
      />
    </div>
  )
}
