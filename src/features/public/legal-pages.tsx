import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { env } from '@/lib/env'
import { PublicLayout } from './public-layout'

/*
  Legal pages. Seller: Victor Roudaut, micro-entrepreneur (sole trader) in France.
  Fields still highlighted with <Placeholder> must be completed before taking payments.
*/

const LAST_UPDATED = 'November 7, 2026'
const SELLER = 'Victor Roudaut'
const ADDRESS = '44k rue Magenta, 21000 Dijon, France'
const CONTACT = 'thepannacottafactory@gmail.com'

function Placeholder({ children }: { children: ReactNode }) {
  return <mark className="rounded bg-warning/20 px-1 text-foreground">{children}</mark>
}

function Email() {
  return (
    <a href={`mailto:${CONTACT}`} className="text-gold underline underline-offset-4">
      {CONTACT}
    </a>
  )
}

function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  useDocumentTitle(title)
  return (
    <PublicLayout>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-4xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
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
        This Privacy Policy explains how {SELLER} (“we”, “us”) collects and uses personal data when you use Magician
        Helper (the “Service”). We act as the data controller under the EU General Data Protection Regulation (GDPR).
      </p>

      <h2>1. Who we are</h2>
      <ul>
        <li>
          Controller: {SELLER}, sole trader (micro-entrepreneur), SIRET <Placeholder>[SIRET NUMBER]</Placeholder>
        </li>
        <li>Address: {ADDRESS}</li>
        <li>
          Contact for privacy questions: <Email />
        </li>
      </ul>

      <h2>2. Data we collect</h2>
      <ul>
        <li>Account data: email address, password (stored hashed by our authentication provider), optional stage name.</li>
        <li>
          Content you enter: tricks, methods, routines, practice sessions, ideas, inventory items, photos and files,
          gigs, fees, quotes, invoices and your business details.
        </li>
        <li>
          Client contact data you choose to store (names, companies, emails, phone numbers). For this data you are the
          controller and we act as your processor: you are responsible for having a valid reason to store it.
        </li>
        <li>
          Billing data: subscription status and Stripe identifiers. Card details are collected and stored by Stripe,
          never by us.
        </li>
        <li>Technical data: connection logs (IP address, date, browser) kept by our hosting providers for security purposes.</li>
      </ul>

      <h2>3. Why we use it (purposes and legal bases)</h2>
      <ul>
        <li>Providing the Service and your account — performance of the contract.</li>
        <li>Managing the free trial, subscriptions and invoices — performance of the contract and legal obligations.</li>
        <li>Sending essential emails (account confirmation, sign-in links, password resets, billing) — performance of the contract.</li>
        <li>Keeping the Service secure and preventing abuse — legitimate interest.</li>
      </ul>
      <p>We do not sell your data, we do not use it for advertising, and we do not read your content except when you ask us for support.</p>

      <h2>4. Service providers (processors)</h2>
      <ul>
        <li>Supabase (database, authentication, file storage) — servers in Frankfurt, Germany (EU).</li>
        <li>Stripe Payments Europe (payments and subscription invoices) — Ireland (EU).</li>
        <li>Resend (sending account and billing emails) — sending region Ireland (EU).</li>
        <li>GitHub Pages, by GitHub Inc. (hosting of the website files) — United States.</li>
        <li>Google Fonts, by Google (typefaces loaded by your browser, which receives your IP address) — United States.</li>
      </ul>
      <p>
        Some of these companies are based in the United States or may access data from there. Such transfers rely on
        the EU–US Data Privacy Framework or on the European Commission’s standard contractual clauses.
      </p>

      <h2>5. How long we keep it</h2>
      <ul>
        <li>
          Your account and content: as long as your account exists. When you delete your account, your data is erased
          immediately from the database; backup copies are overwritten within 30 days.
        </li>
        <li>
          After a trial or subscription ends, your data stays available in read-only mode. Accounts with no sign-in for
          3 years are deleted, after an email notice sent at least 30 days before.
        </li>
        <li>Invoices and accounting records: 10 years, as required by French law (Commercial Code, art. L123-22).</li>
        <li>Connection logs: 12 months at most.</li>
      </ul>

      <h2>6. Your rights</h2>
      <p>
        You can access, correct, export and delete your data at any time from the app: Settings → Your data (export
        in JSON or CSV) and Settings → Danger zone (account deletion). You also have the right to object, to restrict
        processing, to data portability, to give instructions about your data after your death, and to lodge a
        complaint with the French data protection authority (CNIL, www.cnil.fr). For any request, write to <Email />;
        we answer within one month.
      </p>

      <h2>7. Security</h2>
      <p>
        Data is transmitted over encrypted connections (HTTPS). Each account’s data is isolated by database access
        rules, so no other user can read it. Payment details are handled by Stripe. No system is perfectly secure; we
        will notify you and the authorities of any breach as required by law.
      </p>

      <h2>8. Cookies and local storage</h2>
      <p>
        We do not use advertising or analytics cookies. The app stores technical information in your browser (session,
        theme, display preferences, the practice timer) strictly needed for it to work, which does not require your
        consent.
      </p>

      <h2>9. Changes</h2>
      <p>We will inform you by email or in the app of any significant change to this policy.</p>
    </LegalPage>
  )
}

export function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>These Terms govern your use of Magician Helper (the “Service”). By creating an account, you accept these Terms.</p>

      <h2 id="legal-notice">1. Legal notice</h2>
      <ul>
        <li>
          Publisher and seller: {SELLER}, sole trader (micro-entrepreneur), SIRET <Placeholder>[SIRET NUMBER]</Placeholder>
        </li>
        <li>Address: {ADDRESS}</li>
        <li>
          Contact: <Email />
        </li>
        <li>Publication director: {SELLER}</li>
        <li>Website host: GitHub Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, United States.</li>
      </ul>

      <h2>2. The Service</h2>
      <p>
        Magician Helper is an online tool to organize a magician’s repertoire, routines, practice, gigs, clients,
        quotes, invoices and props. It is provided over the internet and can be installed on your devices as a web app.
      </p>

      <h2>3. Account</h2>
      <ul>
        <li>You must provide a valid email address and keep your password confidential.</li>
        <li>You are responsible for the activity on your account and for the content you store.</li>
        <li>You must be at least 18 years old to create an account and subscribe.</li>
      </ul>

      <h2>4. Free trial, subscription and payment</h2>
      <ul>
        <li>Every new account gets a 14-day free trial with full access, without a payment card.</li>
        <li>
          After the trial, continued editing requires a monthly subscription, currently {env.priceLabel}. VAT not
          applicable, article 293 B of the French General Tax Code: the price shown is the final price.
        </li>
        <li>Payments are processed by Stripe. If you subscribe during the trial, the first payment is taken when the trial ends.</li>
        <li>The subscription renews automatically every month until canceled.</li>
        <li>Without an active subscription, your account becomes read-only: you can still view and export your data.</li>
        <li>
          We may change the price with at least 30 days’ notice by email; the change applies from the next billing
          period, and you can cancel before it does.
        </li>
      </ul>

      <h2>5. Right of withdrawal</h2>
      <p>
        If you are a consumer, you have 14 days from the day you subscribe to withdraw, without giving any reason.
        Cancel from the Billing page or write to <Email /> stating that you withdraw. Any amount already paid is
        refunded within 14 days, using the same payment method.
      </p>

      <h2>6. Cancellation</h2>
      <p>
        You can cancel at any time from the Billing page, in two clicks. Cancellation takes effect at the end of the
        current monthly period, which is not refunded (outside the right of withdrawal above); no further payment is
        taken.
      </p>

      <h2>7. Your content</h2>
      <p>
        You keep all rights to the content you enter (including your methods and secrets). You grant us only the
        rights needed to store and display it to you in order to provide the Service. You must not store content that
        is illegal or infringes the rights of others.
      </p>

      <h2>8. Acceptable use</h2>
      <ul>
        <li>No attempt to access other users’ data or to disrupt the Service.</li>
        <li>No automated mass access without our written permission.</li>
        <li>No resale of the Service.</li>
      </ul>

      <h2>9. Availability and liability</h2>
      <p>
        We do our best to keep the Service available and your data safe, but we cannot guarantee uninterrupted
        operation. We recommend exporting your data regularly. Except in the event of gross negligence or where the law
        provides otherwise, our liability is limited to the amounts you paid in the 12 months preceding the event.
      </p>

      <h2>10. Termination</h2>
      <p>
        You can delete your account at any time from Settings. We may suspend an account that seriously breaches these
        Terms, after notice where possible.
      </p>

      <h2>11. Personal data</h2>
      <p>
        How we process personal data is described in our{' '}
        <Link to="/privacy" className="text-gold underline underline-offset-4">
          Privacy Policy
        </Link>
        .
      </p>

      <h2>12. Complaints, mediation and governing law</h2>
      <p>
        For any complaint, write to <Email /> first; we answer within 30 days. If you are a consumer and we cannot find
        a solution, you may refer the dispute free of charge to our consumer mediator:{' '}
        <Placeholder>[NAME AND WEBSITE OF THE CONSUMER MEDIATOR]</Placeholder>.
      </p>
      <p>
        These Terms are governed by French law. If you are a consumer, you keep the protection of the mandatory rules of
        your country of residence and may bring a dispute before the courts of your place of residence. Otherwise,
        disputes are brought before the courts of Dijon, France.
      </p>
    </LegalPage>
  )
}
