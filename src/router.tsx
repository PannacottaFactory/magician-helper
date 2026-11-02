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
  DashboardPage,
} from '@/features/placeholders/pages'
import { HomePage } from '@/features/public/home-page'
import { LegalPlaceholderPage, NotFoundPage } from '@/features/public/simple-pages'

// Each feature is loaded on demand (code splitting): heavy libraries such as the
// rich-text editor are only downloaded when their page is opened.
const tricks = () => import('@/features/tricks/tricks-page')
const trickDetail = () => import('@/features/tricks/trick-detail')
const inventory = () => import('@/features/inventory/inventory-page')
const inventoryDetail = () => import('@/features/inventory/inventory-detail')
const ideas = () => import('@/features/ideas/ideas-page')
const ideaDetail = () => import('@/features/ideas/idea-detail')
const routines = () => import('@/features/routines/routines-page')
const routineDetail = () => import('@/features/routines/routine-detail')
const practice = () => import('@/features/practice/practice-page')
const gigs = () => import('@/features/gigs/gigs-page')
const gigDetail = () => import('@/features/gigs/gig-detail')
const clients = () => import('@/features/clients/clients-page')
const clientDetail = () => import('@/features/clients/client-detail')
const settings = () => import('@/features/settings/settings-page')

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
            {
              path: 'tricks',
              lazy: async () => ({ Component: (await tricks()).TricksPage }),
              children: [{ path: ':trickId', lazy: async () => ({ Component: (await trickDetail()).TrickDetail }) }],
            },
            {
              path: 'routines',
              lazy: async () => ({ Component: (await routines()).RoutinesPage }),
              children: [{ path: ':routineId', lazy: async () => ({ Component: (await routineDetail()).RoutineDetail }) }],
            },
            { path: 'practice', lazy: async () => ({ Component: (await practice()).PracticePage }) },
            {
              path: 'gigs',
              lazy: async () => ({ Component: (await gigs()).GigsPage }),
              children: [{ path: ':gigId', lazy: async () => ({ Component: (await gigDetail()).GigDetailPanel }) }],
            },
            {
              path: 'clients',
              lazy: async () => ({ Component: (await clients()).ClientsPage }),
              children: [{ path: ':clientId', lazy: async () => ({ Component: (await clientDetail()).ClientDetail }) }],
            },
            {
              path: 'inventory',
              lazy: async () => ({ Component: (await inventory()).InventoryPage }),
              children: [{ path: ':itemId', lazy: async () => ({ Component: (await inventoryDetail()).InventoryDetail }) }],
            },
            {
              path: 'ideas',
              lazy: async () => ({ Component: (await ideas()).IdeasPage }),
              children: [{ path: ':ideaId', lazy: async () => ({ Component: (await ideaDetail()).IdeaDetail }) }],
            },
            { path: 'settings', lazy: async () => ({ Component: (await settings()).SettingsPage }) },
            { path: 'billing', element: <BillingPage /> },
          ],
        },
      ],
    },
    { path: '*', element: <NotFoundPage /> },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
)
