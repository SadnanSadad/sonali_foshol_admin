import { useTranslation } from 'react-i18next'
import { ORDER_STATUS_CONFIG } from '@/config/orderStatus'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/types'

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const { i18n } = useTranslation()
  const config = ORDER_STATUS_CONFIG[status]
  const Icon = config.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        className,
      )}
      style={{ color: config.color, backgroundColor: config.bg }}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {i18n.language === 'bn' ? config.labelBn : config.label}
    </span>
  )
}
