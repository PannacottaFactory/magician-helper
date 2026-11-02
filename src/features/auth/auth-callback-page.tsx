import { Link, Navigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { FullPageLoader } from '@/components/common/full-page-loader'
import { AuthLayout } from './auth-layout'
import { useAuth } from './auth-provider'

/** Target of magic links and email confirmations (`/auth/callback?code=…`). */
export function AuthCallbackPage() {
  const { user, loading } = useAuth()
  const params = new URLSearchParams(window.location.search)
  const errorDescription = params.get('error_description')

  if (loading) return <FullPageLoader label="Signing you in…" />
  if (user) return <Navigate to="/app" replace />

  return (
    <AuthLayout
      title="We couldn't sign you in"
      description={
        errorDescription ??
        'This link has expired or was already used. Links must be opened in the browser where you requested them.'
      }
    >
      <Button asChild className="w-full">
        <Link to="/login">Back to sign in</Link>
      </Button>
    </AuthLayout>
  )
}
