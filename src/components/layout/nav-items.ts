import {
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Lightbulb,
  ListOrdered,
  Package,
  ReceiptText,
  Settings,
  Sparkles,
  Timer,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  /** Only active on an exact path match (used for the dashboard index route). */
  end?: boolean
}

export const mainNav: NavItem[] = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/tricks', label: 'Tricks', icon: Sparkles },
  { to: '/app/routines', label: 'Routines', icon: ListOrdered },
  { to: '/app/practice', label: 'Practice', icon: Timer },
  { to: '/app/gigs', label: 'Gigs', icon: CalendarDays },
  { to: '/app/clients', label: 'Clients', icon: Users },
  { to: '/app/invoices', label: 'Invoices', icon: ReceiptText },
  { to: '/app/inventory', label: 'Inventory', icon: Package },
  { to: '/app/ideas', label: 'Ideas', icon: Lightbulb },
]

export const accountNav: NavItem[] = [
  { to: '/app/settings', label: 'Settings', icon: Settings },
  { to: '/app/billing', label: 'Billing', icon: CreditCard },
]

/** Tabs shown in the mobile bottom bar; everything else lives under "More". */
export const mobileTabs = mainNav.filter((item) =>
  ['/app', '/app/tricks', '/app/routines', '/app/gigs'].includes(item.to),
)
export const mobileMore = [...mainNav.filter((item) => !mobileTabs.includes(item)), ...accountNav]
