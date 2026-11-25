import { z } from 'zod'

export const weightVariantSchema = z.object({
  label: z.string().min(1, 'লেবেল আবশ্যক'),
  grams: z.coerce.number().positive('গ্রাম ০ এর বেশি হতে হবে'),
  price: z.coerce.number().positive('দাম আবশ্যক'),
  mrp: z.coerce.number().positive('এমআরপি আবশ্যক'),
  stock: z.coerce.number().min(0, 'স্টক ঋণাত্মক হতে পারবে না'),
  sku: z.string().min(1, 'SKU আবশ্যক'),
})

export const productSchema = z
  .object({
    nameBn: z.string().min(3, 'নাম কমপক্ষে ৩ অক্ষরের হতে হবে').max(120, 'নাম ১২০ অক্ষরের বেশি নয়'),
    nameEn: z.string().optional(),
    slug: z
      .string()
      .min(2, 'স্লাগ আবশ্যক')
      .regex(/^[a-z0-9-]+$/, 'স্লাগ শুধু ইংরেজি ছোট হাতের অক্ষর, সংখ্যা ও হাইফেন'),
    category: z.string().min(1, 'ক্যাটাগরি নির্বাচন করুন'),
    originBn: z.string().min(1, 'উৎস আবশ্যক'),
    badgeBn: z.string().optional(),
    shortDescBn: z.string().min(1, 'সংক্ষিপ্ত বিবরণ আবশ্যক').max(160, '১৬০ অক্ষরের বেশি নয়'),
    fullDescBn: z.string().min(1, 'বিস্তারিত বিবরণ আবশ্যক'),
    nutritionHighlights: z.array(z.string()).default([]),
    images: z.array(z.string()).min(1, 'কমপক্ষে ১টি ছবি যোগ করুন'),
    weights: z.array(weightVariantSchema).min(1, 'কমপক্ষে ১টি ওজন ভ্যারিয়েন্ট আবশ্যক'),
    inStock: z.boolean().default(true),
    status: z.enum(['active', 'draft']),
  })
  .superRefine((value, ctx) => {
    const labels = new Set<string>()
    value.weights.forEach((weight, index) => {
      if (labels.has(weight.label)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['weights', index, 'label'],
          message: 'ওজন লেবেল অনন্য হতে হবে',
        })
      }
      labels.add(weight.label)
      if (weight.price > weight.mrp) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['weights', index, 'price'],
          message: 'বিক্রয় মূল্য এমআরপির বেশি হতে পারবে না',
        })
      }
    })
  })

export type ProductFormValues = z.infer<typeof productSchema>
