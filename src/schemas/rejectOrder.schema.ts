import { z } from 'zod'

export const rejectOrderSchema = z
  .object({
    reason: z.string().min(1, 'কারণ নির্বাচন করুন'),
    feedback: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.reason === 'other' && value.feedback.trim().length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['feedback'],
        message: 'অন্যান্য কারণের জন্য কমপক্ষে ১০ অক্ষরের মন্তব্য দিন',
      })
    }
  })

export type RejectOrderValues = z.infer<typeof rejectOrderSchema>

export const courierSchema = z.object({
  name: z.string().min(1, 'কুরিয়ারের নাম দিন'),
  trackingId: z.string().optional(),
})

export type CourierValues = z.infer<typeof courierSchema>
