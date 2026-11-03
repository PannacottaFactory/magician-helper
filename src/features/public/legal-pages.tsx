import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { AlertTriangle } from 'lucide-react'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { env } from '@/lib/env'
import { PublicLayout } from './public-layout'

/*
  TEMPLATES — to be completed and reviewed by a legal professional before launch.
  Every value in [brackets] must be replaced.
*/

const LAST_UPDATED = '[DATE]'

function Placeholder({ children }: { children: ReactNode }) {
  return <mark className="rounded bg-warning/20 px-1 text-foreground">{children}</mark>
}

function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  useDocumentTitle(title)
  return (
    <PublicLayout>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div role="note" className="mb-8 flex gap-3 rounded-xl border border-warning/50 bg-warning/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
          <p>
            <strong>Template — not legal advice.</strong> This document is a starting point. Every highlighted field
            must be completed, and the whole text reviewed by a qualified professional, before the service is offered to
            the public.
          </p>
        </div>
        <h1 className="font-display text-4xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: <Placeholder>{LAST_UPDATED}</Placeholder>
        </p>
        <div className="legal mt-8 space-y-6 text-sm leading-relaxed [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">
          {children}
        </div>
      </article>
    </PublicLayout>
  )
}

export function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This Privacy Policy explains how <Placeholder>[COMPANY OR TRADING NAME]</Placeholder> (“we”, “us”) collects
        and uses personal data when you use Magician Helper (the “Service”). We act as the data controller under the
        EU General Data Protection Regulation (GDPR).
      </p>

      <h2>1. Who we are</h2>
      <ul>
        <li>
          Controller: <Placeholder>[LEGAL NAME, LEGAL FORM, REGISTRATION NUMBER]</Placeholder>
        </li>
        <li>
          Address: <Placeholder>[POSTAL ADDRESS]</Placeholder>
        </li>
        <li>
          Contact for privacy questions: <Placeholder>[PRIVACY EMAIL]</Placeholder>
        </li>
      </ul>

      <h2>2. Data we collect</h2>
      <ul>
        <li>Account data: email address, password (stored hashed by our authentication provider), optional stage name.</li>
        <li>
          Content you enter: tricks, methods, routines, practice sessions, ideas, inventory items, photos and files,
          gigs, fees and payment statuses.
        </li>
        <li>
          Client contact data you choose to store (names, companies, emails, phone numbers). You are responsible for
          having a valid reason to store this information about your own clients.
        </li>
        <li>
          Billing data: subscription status and Stripe identifiers. Card details are collected and stored by Stripe,
          never by us.
        </li>
        <li>Technical data: connection logs kept by our hosting providers for security purposes.</li>
      </ul>

      <h2>3. Why we use it (purposes and legal bases)</h2>
      <ul>
        <li>Providing the Service and your account — performance of the contract.</li>
        <li>Managing the free trial, subscriptions and invoices — performance of the contract and legal obligations.</li>
        <li>Sending essential emails (sign-in links, password resets, billing) — performance of the contract.</li>
        <li>Keeping the Service secure and preventing abuse — legitimate interest.</li>
      </ul>
      <p>We do not sell your data, we do not use it for advertising, and we do not read your content except when you ask us for support.</p>

      <h2>4. Service providers (processors)</h2>
      <ul>
        <li>Supabase (database, authentication, file storage) — region <Placeholder>[EU REGION OF YOUR PROJECT]</Placeholder>.</li>
        <li>Stripe (payments and invoices).</li>
        <li>GitHub Pages (hosting of the web application files).</li>
        <li>
          <Placeholder>[EMAIL PROVIDER, e.g. Resend]</Placeholder> (sending transactional emails).
        </li>
      </ul>
      <p>
        Some providers may process data outside the EU; such transfers rely on the European Commission's standard
        contractual clauses or an adequacy decision. <Placeholder>[CHECK EACH PROVIDER'S TERMS]</Placeholder>
      </p>

      <h2>5. How long we keep it</h2>
      <ul>
        <li>Your account and content: as long as your account exists. When you delete your account, everything is erased immediately.</li>
        <li>
          After a trial or subscription ends, your data stays available in read-only mode. Accounts inactive for{' '}
          <Placeholder>[DURATION, e.g. 24 months]</Placeholder> may be deleted after an email notice.
        </li>
        <li>Invoices and payment records: kept by Stripe and by us as required by accounting law (<Placeholder>[e.g. 10 years in France]</Placeholder>).</li>
      </ul>

      <h2>6. Your rights</h2>
      <p>
        You can access, correct, export and delete your data at any time from the app: Settings → Your data (export
        in JSON or CSV) and Settings → Danger zone (account deletion). You also have the right to object, to restrict
        processing and to lodge a complaint with your data protection authority (in France: the CNIL, www.cnil.fr).
        For any request, write to <Placeholder>[PRIVACY EMAIL]</Placeholder>.
      </p>

      <h2>7. Security</h2>
      <p>
        Data is transmitted over encrypted connections (HTTPS). Each account's data is isolated by database access
        rules, so no other user can read it. Payment details are handled by Stripe. No system is perfectly secure; we
        will notify you and the authorities of any breach as required by law.
      </p>

      <h2>8. Cookies and local storage</h2>
      <p>
        We do not use advertising or analytics cookies. The app stores technical information in your browser (session,
        theme, display preferences, the practice timer) strictly needed for it to work. <Placeholder>[UPDATE IF YOU ADD ANALYTICS]</Placeholder>
      </p>

      <h2>9. Changes</h2>
      <p>We will inform you by email or in the app of any significant change to this policy.</p>
    </LegalPage>
  )
}

export function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        These Terms govern your use of Magician Helper (the “Service”), provided by{' '}
        <Placeholder>[LEGAL NAME, LEGAL FORM, REGISTRATION NUMBER, ADDRESS]</Placeholder>. By creating an account, you
        accept these Terms.
      </p>

      <h2>1. The Service</h2>
      <p>
        Magician Helper is an online tool to organize a magician's repertoire, routines, practice, gigs, clients and
        props. It is provided over the internet and can be installed on your devices as a web app.
      </p>

      <h2>2. Account</h2>
      <ul>
        <li>You must provide a valid email address and keep your password confidential.</li>
        <li>You are responsible for the activity on your account and for the content you store.</li>
        <li>
          The Service is intended for professionals and adults. <Placeholder>[MINIMUM AGE / B2B-ONLY CLAUSE IF NEEDED]</Placeholder>
        </li>
      </ul>

      <h2>3. Free trial, subscription and payment</h2>
      <ul>
        <li>Every new account gets a 14-day free trial with full access, without a payment card.</li>
        <li>
          After the trial, continued editing requires a monthly subscription, currently {env.priceLabel}{' '}
          <Placeholder>[INCLUDING / EXCLUDING VAT]</Placeholder>. Payments are processed by Stripe.
        </li>
        <li>If you subscribe during the trial, the first payment is taken when the trial ends.</li>
        <li>The subscription renews automatically every month until canceled.</li>
        <li>
          Without an active subscription, your account becomes read-only: you can still view and export your data.
        </li>
        <li>We may change the price with at least <Placeholder>[30 days]</Placeholder> notice; the change applies from the next billing period.</li>
      </ul>

      <h2>4. Cancellation and refunds</h2>
      <p>
        You can cancel at any time from the Billing page. Cancellation takes effect at the end of the current billing
        period; periods already started are not refunded, except where required by law.{' '}
        <Placeholder>[CONSUMER WITHDRAWAL RIGHT (14 days in the EU) — ADAPT IF YOU SELL TO CONSUMERS]</Placeholder>
      </p>

      <h2>5. Your content</h2>
      <p>
        You keep all rights to the content you enter (including your methods and secrets). You grant us only the
        rights needed to store and display it to you in order to provide the Service. You must not store content that
        is illegal or infringes the rights of others.
      </p>

      <h2>6. Acceptable use</h2>
      <ul>
        <li>No attempt to access other users' data or to disrupt the Service.</li>
        <li>No automated mass access without our written permission.</li>
        <li>No resale of the Service.</li>
      </ul>

      <h2>7. Availability and liability</h2>
      <p>
        We do our best to keep the Service available and your data safe, but we cannot guarantee uninterrupted
        operation. We recommend exporting your data regularly. To the extent permitted by law, our liability is
        limited to the amounts you paid in the <Placeholder>[12]</Placeholder> months preceding the event.
      </p>

      <h2>8. Termination</h2>
      <p>
        You can delete your account at any time from Settings. We may suspend an account that seriously breaches these
        Terms, after notice where possible.
      </p>

      <h2>9. Personal data</h2>
      <p>
        How we process personal data is described in our <Link to="/privacy" className="text-gold underline underline-offset-4">Privacy Policy</Link>.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These Terms are governed by <Placeholder>[e.g. French law]</Placeholder>. Disputes will be brought before the
        courts of <Placeholder>[CITY]</Placeholder>, subject to mandatory consumer protection rules. Contact:{' '}
        <Placeholder>[CONTACT EMAIL]</Placeholder>.
      </p>
    </LegalPage>
  )
}
