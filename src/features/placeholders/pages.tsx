import { CreditCard } from 'lucide-react'
import { ComingSoonPage } from './coming-soon-page'

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
