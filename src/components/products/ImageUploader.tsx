import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import imageCompression from 'browser-image-compression'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, ImagePlus, Loader2, Star, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useUploadImageMutation } from '@/hooks/mutations/products'
import { cn } from '@/lib/utils'

function SortableImage({
  url,
  isCover,
  onRemove,
}: {
  url: string
  isCover: boolean
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted',
        isDragging && 'z-10 ring-2 ring-primary',
      )}
    >
      <img src={url} alt="Product" className="size-full object-cover" />
      <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-md bg-background/90 px-1.5 py-0.5 text-[10px] font-medium">
        {isCover ? (
          <>
            <Star className="size-3 fill-[#D4A359] text-[#D4A359]" />
            {t('productForm.cover')}
          </>
        ) : (
          <button type="button" className="cursor-grab" {...attributes} {...listeners}>
            <GripVertical className="size-3.5" />
          </button>
        )}
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1.5 top-1.5 rounded-md bg-destructive p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
        aria-label={t('productForm.remove')}
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  )
}

export function ImageUploader({
  value,
  onChange,
}: {
  value: string[]
  onChange: (images: string[]) => void
}) {
  const { t } = useTranslation()
  const upload = useUploadImageMutation()
  const [processing, setProcessing] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return
      setProcessing(true)
      try {
        const urls: string[] = []
        for (const file of acceptedFiles) {
          const compressed = await imageCompression(file, {
            maxSizeMB: 0.3,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
            fileType: 'image/webp',
          })
          const result = await upload.mutateAsync(compressed)
          urls.push(result.url)
        }
        onChange([...value, ...urls].slice(0, 6))
      } catch (error) {
        toast.error((error as Error).message)
      } finally {
        setProcessing(false)
      }
    },
    [onChange, upload, value],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true,
    maxFiles: Math.max(1, 6 - value.length),
    disabled: value.length >= 6 || processing,
  })

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = value.indexOf(String(active.id))
    const newIndex = value.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    onChange(arrayMove(value, oldIndex, newIndex))
  }

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border bg-secondary/30 px-4 py-6 text-center transition-colors',
          isDragActive && 'border-primary bg-primary/5',
          (value.length >= 6 || processing) && 'cursor-not-allowed opacity-60',
        )}
      >
        <input {...getInputProps()} />
        {processing ? (
          <>
            <Loader2 className="size-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          </>
        ) : (
          <>
            <ImagePlus className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">{t('productForm.uploadImages')}</p>
            <p className="max-w-md text-xs text-muted-foreground">{t('productForm.imagesHint')}</p>
          </>
        )}
      </div>

      {value.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={value} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {value.map((url, index) => (
                <SortableImage
                  key={url}
                  url={url}
                  isCover={index === 0}
                  onRemove={() => onChange(value.filter((_, imageIndex) => imageIndex !== index))}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="text-xs text-muted-foreground">{t('productForm.atLeastOneImage')}</p>
      )}
    </div>
  )
}
