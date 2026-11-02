import { z } from 'zod'

const email = z.string().trim().min(1, 'Email is required').email('Enter a valid email address')
const password = z.string().min(8, 'Use at least 8 characters').max(72, 'Use at most 72 characters')

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
})
export type LoginValues = z.infer<typeof loginSchema>

export const magicLinkSchema = z.object({ email })
export type MagicLinkValues = z.infer<typeof magicLinkSchema>

export const signupSchema = z.object({
  displayName: z.string().trim().max(100, 'Too long').optional(),
  email,
  password,
})
export type SignupValues = z.infer<typeof signupSchema>

export const forgotSchema = z.object({ email })
export type ForgotValues = z.infer<typeof forgotSchema>

export const resetSchema = z
  .object({ password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: 'Passwords do not match', path: ['confirm'] })
export type ResetValues = z.infer<typeof resetSchema>
