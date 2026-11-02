import {
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Lightbulb,
  ListOrdered,
  Package,
  Sparkles,
  Timer,
  Users,
} from 'lucide-react'
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

export const TricksPage = () => (
  <ComingSoonPage
    title="Tricks"
    description="Your repertoire library."
    icon={Sparkles}
    emptyTitle="No tricks yet"
    emptyText="Add the effects you perform or want to learn, with their secrets, props and progress."
    phase={2}
  />
)

export const RoutinesPage = () => (
  <ComingSoonPage
    title="Routines"
    description="Setlists built from your tricks."
    icon={ListOrdered}
    emptyTitle="No routines yet"
    emptyText="Combine tricks into ordered sets with transitions and patter notes."
    phase={3}
  />
)

export const PracticePage = () => (
  <ComingSoonPage
    title="Practice log"
    description="Track every rehearsal."
    icon={Timer}
    emptyTitle="No practice sessions yet"
    emptyText="Log your sessions with the built-in timer and keep your streak alive."
    phase={3}
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

export const InventoryPage = () => (
  <ComingSoonPage
    title="Inventory & gimmicks"
    description="Every prop, with stock alerts."
    icon={Package}
    emptyTitle="Your prop case is empty"
    emptyText="Track quantities, photos and where to rebuy each prop and gimmick."
    phase={2}
  />
)

export const IdeasPage = () => (
  <ComingSoonPage
    title="Ideas"
    description="Your notebook for future magic."
    icon={Lightbulb}
    emptyTitle="No ideas yet"
    emptyText="Capture plots, presentations and patter lines, then turn them into tricks."
    phase={2}
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
