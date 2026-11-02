import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './auth-provider'
import { FullPageLoader } from '@/components/common/full-page-loader'

/** Protects the /app routes: redirects to /login and remembers where the user wanted to go. */
export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}

/** For login/signup pages: already signed-in users go straight to the app. */
export function RedirectIfAuthenticated() {
  const { user, loading } = useAuth()
  if (loading) return <FullPageLoader />
  if (user) return <Navigate to="/app" replace />
  return <Outlet />
}
