/** Turns Supabase auth errors into short, human messages. */
export function authErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) return 'Incorrect email or password.'
  if (lower.includes('email not confirmed')) return 'Please confirm your email first — check your inbox.'
  if (lower.includes('user already registered')) return 'An account with this email already exists. Try signing in.'
  if (lower.includes('signups not allowed for otp') || lower.includes('user not found'))
    return 'No account found with this email. Create one first.'
  if (lower.includes('rate limit') || lower.includes('security purposes'))
    return 'Too many attempts. Please wait a minute and try again.'
  if (lower.includes('failed to fetch')) return 'Network error. Check your connection and try again.'
  return message || 'Something went wrong. Please try again.'
}
