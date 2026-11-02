import { z } from 'zod'
import { optionalUrl } from '@/features/inventory/schemas'
import { TRICK_CATEGORIES, TRICK_STATUSES } from '@/lib/constants'

const categoryValues = TRICK_CATEGORIES.map((c) => c.value) as [string, ...string[]]
const statusValues = TRICK_STATUSES.map((s) => s.value) as [string, ...string[]]

export const trickSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200, 'Too long'),
  effect: z.string().max(20_000),
  secret_and_setup: z.string().max(50_000),
  categories: z.array(z.enum(categoryValues)),
  difficulty: z.number().int().min(1).max(4).nullable(),
  duration_min: z.number().int('Whole minutes only').min(0, 'Cannot be negative').max(600, 'Max 600 minutes').nullable(),
  status: z.enum(statusValues),
  tags: z.array(z.string().max(40)).max(30, 'Too many tags'),
  video_url: optionalUrl,
  references_text: z.string().max(10_000),
  other_props: z.string().max(5_000),
  notes: z.string().max(50_000),
  props: z.array(
    z.object({
      item_id: z.string(),
      item_name: z.string(),
      quantity_needed: z.number().int().min(1, 'At least 1').nullable(),
    }),
  ),
})

export type TrickValues = z.infer<typeof trickSchema>
