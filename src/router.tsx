import { createBrowserRouter } from 'react-router'
import { AppShell } from '@/components/layout/app-shell'
import { AuthCallbackPage } from '@/features/auth/auth-callback-page'
import { ForgotPasswordPage } from '@/features/auth/forgot-password-page'
import { LoginPage } from '@/features/auth/login-page'
import { ResetPasswordPage } from '@/features/auth/reset-password-page'
import { RedirectIfAuthenticated, RequireAuth } from '@/features/auth/route-guards'
import { SignupPage } from '@/features/auth/signup-page'
import {
  BillingPage,
  ClientsPage,
  DashboardPage,
  GigsPage,
  IdeasPage,
  InventoryPage,
  PracticePage,
  RoutinesPage,
  TricksPage,
} from '@/features/placeholders/pages'
import { HomePage } from '@/features/public/home-page'
import { LegalPlaceholderPage, NotFoundPage } from '@/features/public/simple-pages'
import { SettingsPage } from '@/features/settings/settings-page'

// BrowserRouter-style routing. On GitHub Pages, deep links are served by 404.html
// (a copy of index.html, see scripts/spa-fallback.mjs). `basename` = Vite `base`.
export const router = createBrowserRouter(
  [
    { path: '/', element: <HomePage /> },
    { path: '/privacy', element: <LegalPlaceholderPage title="Privacy Policy" /> },
    { path: '/terms', element: <LegalPlaceholderPage title="Terms of Service" /> },
    { path: '/auth/callback', element: <AuthCallbackPage /> },
    { path: '/reset-password', element: <ResetPasswordPage /> },
    {
      element: <RedirectIfAuthenticated />,
      children: [
        { path: '/login', element: <LoginPage /> },
        { path: '/signup', element: <SignupPage /> },
        { path: '/forgot-password', element: <ForgotPasswordPage /> },
      ],
    },
    {
      path: '/app',
      element: <RequireAuth />,
      children: [
        {
          element: <AppShell />,
          children: [
            { index: true, element: <DashboardPage /> },
            { path: 'tricks', element: <TricksPage /> },
            { path: 'routines', element: <RoutinesPage /> },
            { path: 'practice', element: <PracticePage /> },
            { path: 'gigs', element: <GigsPage /> },
            { path: 'clients', element: <ClientsPage /> },
            { path: 'inventory', element: <InventoryPage /> },
            { path: 'ideas', element: <IdeasPage /> },
            { path: 'settings', element: <SettingsPage /> },
            { path: 'billing', element: <BillingPage /> },
          ],
        },
      ],
    },
    { path: '*', element: <NotFoundPage /> },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
)
