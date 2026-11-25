import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/shared/StateViews'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Switch } from '@/components/ui/switch'
import { useCategoriesQuery } from '@/hooks/queries/categories'
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useReorderCategoriesMutation,
  useUpdateCategoryMutation,
} from '@/hooks/mutations/categories'
import { categorySchema, type CategoryFormValues } from '@/schemas/settings.schema'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'

function SortableRow({
  category,
  onEdit,
  onDelete,
  onToggleHidden,
}: {
  category: Category
  onEdit: () => void
  onDelete: () => void
  onToggleHidden: (hidden: boolean) => void
}) {
  const { t, i18n } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0',
        isDragging && 'relative z-10 bg-card shadow-lg',
      )}
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
        aria-label="Reorder category"
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{i18n.language === 'bn' ? category.nameBn : category.nameEn}</p>
        <p className="tabular text-xs text-muted-foreground">
          /{category.slug} · {category.productCount ?? 0} {t('nav.products')}
        </p>
      </div>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="hidden sm:inline">{t('products.active')}</span>
        <Switch checked={!category.hidden} onCheckedChange={(checked) => onToggleHidden(!checked)} />
      </label>
      <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label={t('common.edit')}>
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-destructive hover:text-destructive"
        onClick={onDelete}
        aria-label={t('common.delete')}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}

export default function CategoriesPage() {
  const { t } = useTranslation()
  const categoriesQuery = useCategoriesQuery()
  const createMutation = useCreateCategoryMutation()
  const updateMutation = useUpdateCategoryMutation()
  const deleteMutation = useDeleteCategoryMutation()
  const reorderMutation = useReorderCategoriesMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { nameEn: '', nameBn: '', slug: '', hidden: false },
  })

  useEffect(() => {
    if (!dialogOpen) return
    form.reset(
      editing
        ? {
            nameEn: editing.nameEn,
            nameBn: editing.nameBn,
            slug: editing.slug,
            hidden: editing.hidden,
          }
        : { nameEn: '', nameBn: '', slug: '', hidden: false },
    )
  }, [dialogOpen, editing, form])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const categories = categoriesQuery.data ?? []

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = categories.findIndex((category) => category.id === active.id)
    const newIndex = categories.findIndex((category) => category.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    reorderMutation.mutate(arrayMove(categories, oldIndex, newIndex))
  }

  const openAdd = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (category: Category) => {
    setEditing(category)
    setDialogOpen(true)
  }

  const onSubmit = (values: CategoryFormValues) => {
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, payload: values },
        { onSuccess: () => setDialogOpen(false) },
      )
    } else {
      createMutation.mutate(values, { onSuccess: () => setDialogOpen(false) })
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('nav.categories')}
        description={t('categories.subtitle')}
        actions={
          <Button onClick={openAdd}>
            <Plus className="size-4" />
            {t('common.add')}
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {categoriesQuery.isLoading ? (
            <div className="p-4">
              <TableSkeleton rows={4} columns={3} />
            </div>
          ) : categoriesQuery.isError ? (
            <ErrorState onRetry={() => categoriesQuery.refetch()} />
          ) : categories.length === 0 ? (
            <EmptyState title={t('common.noData')} action={<Button onClick={openAdd}>{t('common.add')}</Button>} />
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={categories.map((category) => category.id)} strategy={verticalListSortingStrategy}>
                {categories.map((category) => (
                  <SortableRow
                    key={category.id}
                    category={category}
                    onEdit={() => openEdit(category)}
                    onDelete={() => setDeleteTarget(category)}
                    onToggleHidden={(hidden) =>
                      updateMutation.mutate({ id: category.id, payload: { hidden } })
                    }
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditing(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t('common.edit') : t('common.add')}</DialogTitle>
            <DialogDescription>{t('categories.subtitle')}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <FormLabel>{t('productForm.nameEn')} *</FormLabel>
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
                  <FormItem>
                    <FormLabel>{t('productForm.slug')} *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="spices" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hidden"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-border p-3">
                    <FormLabel>{t('products.active')}</FormLabel>
                    <FormControl>
                      <Switch checked={!field.value} onCheckedChange={(checked) => field.onChange(!checked)} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {t('common.save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('common.delete')}
        description={deleteTarget ? `${deleteTarget.nameBn} (${deleteTarget.slug})` : undefined}
        confirmText={t('common.delete')}
        destructive
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
        }}
      />
    </div>
  )
}
