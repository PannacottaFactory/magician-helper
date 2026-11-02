import { CreditCard, LayoutDashboard } from 'lucide-react'
import { ComingSoonPage } from './coming-soon-page'

export const DashboardPage = () => (
  <ComingSoonPage
    title="Dashboard"
    description="Your week at a glance."
    icon={LayoutDashboard}
    emptyTitle="Your stage is set"
    emptyText="Upcoming gigs, tricks to polish, stock alerts and your practice streak will appear here."
    phase={5}
  />
)

export const BillingPage = () => (
  <ComingSoonPage
    title="Billing"
    description="Your plan and payments."
    icon={CreditCard}
    emptyTitle="Subscriptions are coming"
    emptyText="You're on the free trial. Subscription management will be available here."
    phase={6}
  />
)
