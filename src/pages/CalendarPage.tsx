import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import FullCalendar from '@fullcalendar/react'
import type { DatesSetArg, EventClickArg, EventDropArg, EventInput } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import bnLocale from '@fullcalendar/core/locales/bn'
import { Plus } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ORDER_STATUS_CONFIG } from '@/config/orderStatus'
import { useCalendarEventsQuery } from '@/hooks/queries/calendar'
import { useOrdersQuery } from '@/hooks/queries/orders'
import {
  useCreateCalendarEventMutation,
  useDeleteCalendarEventMutation,
  useUpdateCalendarEventMutation,
} from '@/hooks/mutations/calendar'
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/date'
import type { CalendarEvent } from '@/types'

type EventKind = 'delivery' | 'order' | 'admin'

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string().min(1, 'Date is required'),
  note: z.string().optional(),
})

type EventFormValues = z.infer<typeof eventSchema>

function monthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return { from: start.toISOString(), to: end.toISOString() }
}

export default function CalendarPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'bn' ? 'bn' : 'en'
  const navigate = useNavigate()
  const initialRange = useMemo(monthRange, [])
  const [range, setRange] = useState(initialRange)
  const [visibleKinds, setVisibleKinds] = useState<Record<EventKind, boolean>>({
    delivery: true,
    order: true,
    admin: true,
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CalendarEvent | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null)
  const [pendingDelivery, setPendingDelivery] = useState<{ id: string; date: string } | null>(null)

  const eventsQuery = useCalendarEventsQuery(range.from, range.to)
  const ordersQuery = useOrdersQuery({ status: 'all', page: 1, limit: 100 })
  const createMutation = useCreateCalendarEventMutation()
  const updateMutation = useUpdateCalendarEventMutation()
  const deleteMutation = useDeleteCalendarEventMutation()

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: { title: '', date: '', note: '' },
  })

  useEffect(() => {
    if (dialogOpen) form.reset(editing ? {
      title: editing.title,
      date: editing.start.slice(0, 10),
      note: editing.note ?? '',
    } : { title: '', date: form.getValues('date') || new Date().toISOString().slice(0, 10), note: '' })
  }, [dialogOpen, editing, form])

  const orders = ordersQuery.data?.items ?? []
  const orderMap = useMemo(() => new Map(orders.map((order) => [order.id, order])), [orders])

  const apiEvents = useMemo<EventInput[]>(() => {
    return (eventsQuery.data ?? []).map((event) => {
      if (event.type === 'delivery') {
        const order = event.orderId ? orderMap.get(event.orderId) : undefined
        const color = order ? ORDER_STATUS_CONFIG[order.status].color : '#6B7280'
        return {
          id: event.id,
          title: event.title,
          start: event.start,
          allDay: true,
          backgroundColor: color,
          borderColor: color,
          textColor: '#FFFFFF',
          extendedProps: { kind: 'delivery', eventId: event.id, orderId: event.orderId },
        }
      }
      return {
        id: event.id,
        title: event.title,
        start: event.start,
        allDay: true,
        backgroundColor: '#DCFCE7',
        borderColor: '#16A34A',
        textColor: '#166534',
        extendedProps: { kind: 'admin', eventId: event.id },
      }
    })
  }, [eventsQuery.data, orderMap])

  const placedEvents = useMemo<EventInput[]>(() => {
    const fromTime = new Date(range.from).getTime()
    const toTime = new Date(range.to).getTime()
    const counts = new Map<string, number>()
    orders.forEach((order) => {
      const time = new Date(order.createdAt).getTime()
      if (time < fromTime || time >= toTime) return
      const day = order.createdAt.slice(0, 10)
      counts.set(day, (counts.get(day) ?? 0) + 1)
    })
    return [...counts.entries()].map(([day, count]) => ({
      id: `placed-${day}`,
      title: `${count} ${t('calendar.ordersPlaced')}`,
      start: day,
      allDay: true,
      backgroundColor: '#FEF3C7',
      borderColor: '#F59E0B',
      textColor: '#92400E',
      extendedProps: { kind: 'order', count },
    }))
  }, [orders, range, t])

  const visibleEvents = useMemo(
    () =>
      [...apiEvents, ...placedEvents].filter((event) => {
        const kind = event.extendedProps?.kind as EventKind | undefined
        return kind ? visibleKinds[kind] : true
      }),
    [apiEvents, placedEvents, visibleKinds],
  )

  const counts = useMemo(
    () => ({
      delivery: apiEvents.filter((event) => event.extendedProps?.kind === 'delivery').length,
      order: placedEvents.reduce(
        (sum, event) => sum + ((event.extendedProps?.count as number | undefined) ?? 0),
        0,
      ),
      admin: apiEvents.filter((event) => event.extendedProps?.kind === 'admin').length,
    }),
    [apiEvents, placedEvents],
  )

  const openCreate = (date?: string) => {
    setEditing(null)
    form.reset({ title: '', date: date ?? new Date().toISOString().slice(0, 10), note: '' })
    setDialogOpen(true)
  }

  const openEdit = (event: CalendarEvent) => {
    setEditing(event)
    form.reset({ title: event.title, date: event.start.slice(0, 10), note: event.note ?? '' })
    setDialogOpen(true)
  }

  const onSubmit = (values: EventFormValues) => {
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, payload: { title: values.title, start: values.date, allDay: true, note: values.note } },
        { onSuccess: () => setDialogOpen(false) },
      )
      return
    }
    createMutation.mutate(
      { title: values.title, start: values.date, allDay: true, note: values.note },
      { onSuccess: () => setDialogOpen(false) },
    )
  }

  const handleDatesSet = (arg: DatesSetArg) => {
    setRange((previous) =>
      previous.from === arg.startStr && previous.to === arg.endStr
        ? previous
        : { from: arg.startStr, to: arg.endStr },
    )
  }

  const handleEventClick = (arg: EventClickArg) => {
    const { kind, eventId, orderId } = arg.event.extendedProps as {
      kind: EventKind
      eventId?: string
      orderId?: string
    }
    if (kind === 'delivery' && orderId) {
      navigate(`/orders/${orderId}`)
      return
    }
    if (kind === 'admin' && eventId) {
      const event = eventsQuery.data?.find((entry) => entry.id === eventId)
      if (event) openEdit(event)
    }
  }

  const handleEventDrop = (arg: EventDropArg) => {
    const { kind, eventId } = arg.event.extendedProps as { kind: EventKind; eventId?: string }
    const date = arg.event.startStr.slice(0, 10)
    if (kind === 'order') {
      arg.revert()
      return
    }
    if (kind === 'delivery') {
      arg.revert()
      if (eventId) setPendingDelivery({ id: eventId, date })
      return
    }
    if (eventId) {
      updateMutation.mutate({ id: eventId, payload: { start: date, allDay: true } })
    }
  }

  const kindConfig: Array<{ kind: EventKind; label: string; color: string }> = [
    { kind: 'delivery', label: t('calendar.deliveries'), color: '#0F766E' },
    { kind: 'order', label: t('calendar.ordersPlaced'), color: '#D97706' },
    { kind: 'admin', label: t('calendar.adminEvents'), color: '#16A34A' },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('calendar.title')}
        description={t('calendar.subtitle')}
        actions={
          <Button onClick={() => openCreate()}>
            <Plus className="size-4" />
            {t('calendar.addEvent')}
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {kindConfig.map(({ kind, label, color }) => (
          <button
            key={kind}
            type="button"
            onClick={() => setVisibleKinds((previous) => ({ ...previous, [kind]: !previous[kind] }))}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              visibleKinds[kind]
                ? 'border-border bg-card text-foreground'
                : 'border-dashed border-border bg-transparent text-muted-foreground opacity-60',
            )}
          >
            <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
            {label}
            <span className="tabular rounded-full bg-secondary px-1.5 text-[10px]">
              {counts[kind]}
            </span>
          </button>
        ))}
      </div>

      <div className="sfo-calendar rounded-xl border border-border bg-card p-3 sm:p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth',
          }}
          locale={lang === 'bn' ? bnLocale : 'en'}
          events={visibleEvents}
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          selectable
          selectMirror
          select={(info) => openCreate(info.startStr.slice(0, 10))}
          editable
          eventStartEditable
          eventDurationEditable={false}
          height="auto"
          dayMaxEvents={3}
          eventDisplay="block"
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? editing.title : t('calendar.addEvent')}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calendar.eventTitle')} *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('calendar.eventTitle')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calendar.date')} *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calendar.note')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2 sm:justify-between">
                {editing ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      setDeleteTarget(editing)
                      setDialogOpen(false)
                    }}
                  >
                    {t('calendar.deleteEvent')}
                  </Button>
                ) : (
                  <span />
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {t('calendar.saveEvent')}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelivery)}
        onOpenChange={(open) => !open && setPendingDelivery(null)}
        title={t('calendar.reschedule')}
        description={
          pendingDelivery
            ? t('calendar.rescheduleConfirm', {
                date: formatDate(pendingDelivery.date, 'dd MMM yyyy', lang),
              })
            : ''
        }
        confirmText={t('calendar.reschedule')}
        onConfirm={() => {
          if (!pendingDelivery) return
          updateMutation.mutate(
            { id: pendingDelivery.id, payload: { start: pendingDelivery.date } },
            { onSuccess: () => setPendingDelivery(null) },
          )
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('calendar.deleteEvent')}
        description={t('calendar.deleteDesc')}
        confirmText={t('common.delete')}
        destructive
        onConfirm={() => {
          if (!deleteTarget) return
          deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
        }}
      />
    </div>
  )
}
