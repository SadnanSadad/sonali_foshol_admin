import type { UseFormReturn } from 'react-hook-form'
import { useFieldArray } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import type { ProductFormValues } from '@/schemas/product.schema'

export function VariantsRepeater({ form }: { form: UseFormReturn<ProductFormValues> }) {
  const { t } = useTranslation()
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'weights' })

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div key={field.id} className="rounded-xl border border-border bg-secondary/20 p-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <FormField
              control={form.control}
              name={`weights.${index}.label`}
              render={({ field: input }) => (
                <FormItem>
                  <FormLabel>{t('productForm.weightLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder="১ কেজি" {...input} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`weights.${index}.grams`}
              render={({ field: input }) => (
                <FormItem>
                  <FormLabel>{t('productForm.grams')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...input} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`weights.${index}.price`}
              render={({ field: input }) => (
                <FormItem>
                  <FormLabel>{t('productForm.price')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...input} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`weights.${index}.mrp`}
              render={({ field: input }) => (
                <FormItem>
                  <FormLabel>{t('productForm.mrp')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...input} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`weights.${index}.stock`}
              render={({ field: input }) => (
                <FormItem>
                  <FormLabel>{t('productForm.stock')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...input} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`weights.${index}.sku`}
              render={({ field: input }) => (
                <FormItem>
                  <FormLabel>{t('productForm.sku')}</FormLabel>
                  <FormControl>
                    <Input placeholder="MINIKET-1000" {...input} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {fields.length > 1 ? (
            <div className="mt-2 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => remove(index)}
              >
                <Trash2 className="size-4" />
                {t('productForm.removeVariant')}
              </Button>
            </div>
          ) : null}
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          append({ label: '', grams: 0, price: 0, mrp: 0, stock: 0, sku: '' })
        }
      >
        <Plus className="size-4" />
        {t('productForm.addVariant')}
      </Button>
    </div>
  )
}
