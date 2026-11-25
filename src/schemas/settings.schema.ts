import { z } from 'zod'

export const settingsSchema = z.object({
  storeName: z.string().min(1, 'স্টোরের নাম আবশ্যক'),
  storeNameBn: z.string().min(1, 'বাংলা নাম আবশ্যক'),
  whatsappNumber: z
    .string()
    .min(11, '১১ ডিজিটের নম্বর দিন')
    .regex(/^[0-9+\s-]+$/, 'শুধু সংখ্যা ব্যবহার করুন'),
  facebookUrl: z.string().url('সঠিক URL দিন').or(z.literal('')),
  messengerUrl: z.string().url('সঠিক URL দিন').or(z.literal('')),
  deliveryFeeInside: z.coerce.number().min(0),
  deliveryFeeOutside: z.coerce.number().min(0),
  freeShippingThreshold: z.coerce.number().min(0),
  lowStockThreshold: z.coerce.number().min(0),
})

export type SettingsFormValues = z.infer<typeof settingsSchema>

export const categorySchema = z.object({
  nameEn: z.string().min(1, 'English name is required'),
  nameBn: z.string().min(1, 'বাংলা নাম আবশ্যক'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers and hyphens'),
  hidden: z.boolean().default(false),
})

export type CategoryFormValues = z.infer<typeof categorySchema>

export const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginValues = z.infer<typeof loginSchema>
