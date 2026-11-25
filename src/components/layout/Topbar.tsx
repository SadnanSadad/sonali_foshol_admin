import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronRight,
  Languages,
  Leaf,
  LogOut,
  Menu,
  Search,
  Settings,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { navigation } from '@/config/navigation'
import { changeLanguage, type AppLanguage } from '@/i18n'
import { useDashboardSummaryQuery } from '@/hooks/queries/dashboard'
import { useLogoutMutation } from '@/hooks/mutations/auth'
import { useAuthStore } from '@/store/auth.store'
import { initials } from '@/utils/format'

const segmentKeys: Record<string, string> = {
  products: 'nav.products',
  new: 'nav.addProduct',
  categories: 'nav.categories',
  orders: 'nav.orders',
  calendar: 'nav.calendar',
  customers: 'nav.customers',
  reviews: 'nav.reviews',
  settings: 'nav.settings',
}

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [commandOpen, setCommandOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const logoutMutation = useLogoutMutation()
  const { data: summary } = useDashboardSummaryQuery()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const segments = location.pathname.split('/').filter(Boolean)
  const language: AppLanguage = i18n.language === 'bn' ? 'bn' : 'en'
  const pending = summary?.pendingOrders ?? 0

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`
    const label = segmentKeys[segment] ? t(segmentKeys[segment]) : segment
    return { href, label, isLast: index === segments.length - 1 }
  })

  return (
    <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/85 px-3 backdrop-blur sm:px-5">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </Button>

      <Breadcrumb className="hidden min-w-0 md:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            {segments.length === 0 ? (
              <BreadcrumbPage>{t('nav.dashboard')}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link to="/">{t('nav.dashboard')}</Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
          {crumbs.map((crumb) => (
            <BreadcrumbItem key={crumb.href} className="min-w-0">
              <BreadcrumbSeparator>
                <ChevronRight className="size-3.5" />
              </BreadcrumbSeparator>
              {crumb.isLast ? (
                <BreadcrumbPage className="max-w-40 truncate">{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="hidden w-56 justify-start gap-2 text-muted-foreground sm:flex"
          onClick={() => setCommandOpen(true)}
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">{t('common.search')}</span>
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
            Ctrl K
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={() => setCommandOpen(true)}
          aria-label={t('common.search')}
        >
          <Search className="size-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => changeLanguage(language === 'bn' ? 'en' : 'bn')}
          aria-label={t('common.language')}
          title={t('common.language')}
        >
          <Languages className="size-5" />
        </Button>
        <span className="hidden rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-semibold text-secondary-foreground sm:inline">
          {language === 'bn' ? 'বাংলা' : 'EN'}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label={t('common.notifications')}>
              <Bell className="size-5" />
              {pending > 0 ? (
                <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                  {pending > 9 ? '9+' : pending}
                </span>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>{t('common.notifications')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/orders?status=pending')}>
              <Bell className="size-4" />
              {pending > 0 ? t('orders.pendingBadge', { count: pending }) : t('dashboard.empty')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/products?stock=low')}>
              <Leaf className="size-4" />
              {t('dashboard.lowStock')}: {summary?.lowStockCount ?? 0}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ml-1 flex items-center gap-2 rounded-full p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Account menu"
            >
              <Avatar className="size-8">
                {user?.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
                <AvatarFallback className="bg-sidebar text-xs text-sidebar-foreground">
                  {initials(user?.name ?? 'SO')}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="size-4" />
              {t('nav.settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                logoutMutation.mutate(undefined, {
                  onSettled: () => navigate('/login', { replace: true }),
                })
              }}
            >
              <LogOut className="size-4" />
              {t('common.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen} title={t('common.search')}>
        <CommandInput placeholder={t('products.searchPlaceholder')} />
        <CommandList>
          <CommandEmpty>{t('common.noData')}</CommandEmpty>
          <CommandGroup heading={t('nav.group.overview')}>
            {navigation.flatMap((group) => group.items).map((item) => {
              const Icon = item.icon
              return (
                <CommandItem
                  key={item.key}
                  value={`${t(item.labelKey)} ${item.to}`}
                  onSelect={() => {
                    navigate(item.to)
                    setCommandOpen(false)
                  }}
                >
                  <Icon className="size-4" />
                  {t(item.labelKey)}
                </CommandItem>
              )
            })}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading={t('nav.group.sales')}>
            <CommandItem
              value="pending orders"
              onSelect={() => {
                navigate('/orders?status=pending')
                setCommandOpen(false)
              }}
            >
              <Bell className="size-4" />
              {t('orders.pendingBadge', { count: pending })}
            </CommandItem>
            <CommandItem
              value="low stock products"
              onSelect={() => {
                navigate('/products?stock=low')
                setCommandOpen(false)
              }}
            >
              <Leaf className="size-4" />
              {t('dashboard.lowStockTitle')}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  )
}
