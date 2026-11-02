import { CalendarDays, CreditCard, LayoutDashboard, Users } from 'lucide-react'
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

export const GigsPage = () => (
  <ComingSoonPage
    title="Gigs"
    description="Your shows, calendar and payments."
    icon={CalendarDays}
    emptyTitle="No gigs booked yet"
    emptyText="Plan your performances, link routines and get an automatic prep checklist."
    phase={4}
  />
)

export const ClientsPage = () => (
  <ComingSoonPage
    title="Clients"
    description="The people who book you."
    icon={Users}
    emptyTitle="No clients yet"
    emptyText="Keep contacts and see the full history of gigs for each client."
    phase={4}
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
