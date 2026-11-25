import { Leaf, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { navigation } from '@/config/navigation'
import { Button } from '@/components/ui/button'
import { useDashboardSummaryQuery } from '@/hooks/queries/dashboard'
import { useUiStore } from '@/store/ui.store'
import { cn } from '@/lib/utils'

interface SidebarContentProps {
  collapsed?: boolean
  onNavigate?: () => void
  onToggle?: () => void
}

export function SidebarContent({ collapsed = false, onNavigate, onToggle }: SidebarContentProps) {
  const { t } = useTranslation()
  const { data: summary } = useDashboardSummaryQuery()
  const pending = summary?.pendingOrders ?? 0

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className={cn('flex h-16 items-center gap-2.5 px-4', collapsed && 'justify-center px-2')}>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-active text-sidebar-primary-foreground">
          <Leaf className="size-5" />
        </span>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">সোনালী ফসল</p>
            <p className="truncate text-[11px] text-sidebar-foreground/60">Admin Panel</p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-3">
        {navigation.map((group) => (
          <div key={group.key}>
            {!collapsed ? (
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                {t(group.labelKey)}
              </p>
            ) : null}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const showBadge = item.badge === 'pendingOrders' && pending > 0
                return (
                  <li key={item.key}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      title={collapsed ? t(item.labelKey) : undefined}
                      className={({ isActive }) =>
                        cn(
                          'relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                          collapsed && 'justify-center px-0',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-primary'
                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                        )
                      }
                    >
                      <Icon className="size-4.5 shrink-0" />
                      {!collapsed ? <span className="flex-1 truncate">{t(item.labelKey)}</span> : null}
                      {showBadge ? (
                        collapsed ? (
                          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-sidebar-active" />
                        ) : (
                          <span className="rounded-full bg-sidebar-active px-1.5 py-0.5 text-[11px] font-semibold text-sidebar-primary-foreground">
                            {pending}
                          </span>
                        )
                      ) : null}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {onToggle ? (
        <div className="border-t border-sidebar-border p-2">
          <Button
            variant="ghost"
            size={collapsed ? 'icon' : 'sm'}
            onClick={onToggle}
            className={cn(
              'w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
              collapsed && 'mx-auto',
            )}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            {!collapsed ? <span className="ml-1">Collapse</span> : null}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export function Sidebar() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed)
  const toggle = useUiStore((state) => state.toggleSidebar)

  return (
    <aside
      className={cn(
        'no-print sticky top-0 hidden h-screen shrink-0 border-r border-sidebar-border transition-[width] duration-200 lg:block',
        collapsed ? 'w-[68px]' : 'w-60',
      )}
    >
      <SidebarContent collapsed={collapsed} onToggle={toggle} />
    </aside>
  )
}
