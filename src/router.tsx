import { createBrowserRouter } from 'react-router'
import { RouteError } from '@/components/common/route-error'
import { AppShell } from '@/components/layout/app-shell'
import { AuthCallbackPage } from '@/features/auth/auth-callback-page'
import { ForgotPasswordPage } from '@/features/auth/forgot-password-page'
import { LoginPage } from '@/features/auth/login-page'
import { ResetPasswordPage } from '@/features/auth/reset-password-page'
import { RedirectIfAuthenticated, RequireAuth } from '@/features/auth/route-guards'
import { SignupPage } from '@/features/auth/signup-page'
import { LandingPage } from '@/features/public/landing-page'
import { NotFoundPage } from '@/features/public/simple-pages'

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
const legal = () => import('@/features/public/legal-pages')
const dashboard = () => import('@/features/dashboard/dashboard-page')
const billing = () => import('@/features/billing/billing-page')
const settings = () => import('@/features/settings/settings-page')
const documents = () => import('@/features/documents/documents-page')
const documentDetail = () => import('@/features/documents/document-detail')

// BrowserRouter-style routing. On GitHub Pages, deep links are served by 404.html
// (a copy of index.html, see scripts/spa-fallback.mjs). `basename` = Vite `base`.
export const router = createBrowserRouter(
  [
    {
      // every route shares one error screen (also handles stale code after a deploy)
      errorElement: <RouteError />,
      children: [
    { path: '/', element: <LandingPage /> },
    { path: '/privacy', lazy: async () => ({ Component: (await legal()).PrivacyPage }) },
    { path: '/terms', lazy: async () => ({ Component: (await legal()).TermsPage }) },
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
            { index: true, lazy: async () => ({ Component: (await dashboard()).DashboardPage }) },
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
              path: 'invoices',
              lazy: async () => ({ Component: (await documents()).DocumentsPage }),
              children: [{ path: ':docId', lazy: async () => ({ Component: (await documentDetail()).DocumentDetail }) }],
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
            { path: 'billing', lazy: async () => ({ Component: (await billing()).BillingPage }) },
          ],
        },
      ],
    },
    { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
)
