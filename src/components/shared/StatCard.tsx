import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: ReactNode
  icon: LucideIcon
  hint?: string
  delta?: number
  deltaLabel?: string
  to?: string
  className?: string
}

export function StatCard({ title, value, icon: Icon, hint, delta, deltaLabel, to, className }: StatCardProps) {
  const body = (
    <Card className={cn('h-full transition-colors', to && 'hover:border-primary/40', className)}>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="tabular mt-2 text-2xl font-semibold text-foreground">{value}</p>
          {delta !== undefined ? (
            <p
              className={cn(
                'mt-1 flex items-center gap-1 text-xs font-medium',
                delta >= 0 ? 'text-[#16A34A]' : 'text-destructive',
              )}
            >
              {delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
              {Math.abs(delta)}% {deltaLabel}
            </p>
          ) : hint ? (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  )

  if (to) {
    return (
      <Link to={to} className="block focus-visible:outline-none">
        {body}
      </Link>
    )
  }
  return body
}
