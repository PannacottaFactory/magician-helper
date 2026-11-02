import { z } from 'zod'
import { safeUrl } from '@/lib/format'

export const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => !v || safeUrl(v) !== null, 'Enter a full link starting with https://')

export const inventorySchema = z.object({
  item_name: z.string().trim().min(1, 'Name is required').max(200, 'Too long'),
  quantity: z.number().int('Whole numbers only').min(0, 'Cannot be negative').nullable(),
  low_stock_threshold: z.number().int('Whole numbers only').min(0, 'Cannot be negative').nullable(),
  buy_link: optionalUrl,
  cost: z.number().min(0, 'Cannot be negative').max(99_999_999).nullable(),
  notes: z.string().max(20_000),
})

export type InventoryValues = z.infer<typeof inventorySchema>
