import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <Compass className="size-8" />
      </span>
      <div>
        <p className="tabular text-sm font-semibold text-primary">404</p>
        <h1 className="font-serif text-2xl font-semibold">{t('notFound.title')}</h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t('notFound.desc')}</p>
      </div>
      <Button asChild>
        <Link to="/">{t('notFound.backHome')}</Link>
      </Button>
    </div>
  )
}
