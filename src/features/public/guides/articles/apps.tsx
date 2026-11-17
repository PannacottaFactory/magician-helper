import { Link } from 'react-router'
import { GuideLink, GuideTable, Tip } from '../guide-ui'

export function AppsGuide() {
  return (
    <>
      <p>
        Search for “apps for magicians” and you mostly find trick apps — apps that <em>are</em> the trick. This guide is
        about the other kind: the tools that help you run your magic. Your repertoire, your setlists, your practice, your
        bookings and your paperwork. Here is what a working magician actually needs, and how to choose.
      </p>

      <h2 id="jobs">The five jobs your tools have to do</h2>
      <ol>
        <li>
          <strong>Remember your repertoire</strong> — every trick you know, how it works, what it needs and whether it
          is ready to perform.
        </li>
        <li>
          <strong>Build sets</strong> — put tricks in order for a given show, with a running time and a list of props.
        </li>
        <li>
          <strong>Keep you practicing</strong> — know what you worked on, what is still rough and which tricks have gone
          cold.
        </li>
        <li>
          <strong>Run your bookings</strong> — gigs in a calendar, client details, fees, deposits and what is still
          unpaid.
        </li>
        <li>
          <strong>Do the paperwork</strong> — quotes, invoices and the details the organizer needs before the show.
        </li>
      </ol>
      <p>
        Most magicians cover these with five different tools, or with none. Both cost you time — and occasionally a
        booking.
      </p>

      <h2 id="options">The usual options</h2>
      <h3>A notes app</h3>
      <p>
        Free and always in your pocket, which is why it is everyone’s first trick list. But notes have no structure: no
        status, no durations, no filter for “standing, no table, ten minutes”. And your methods are in plain sight the
        moment you open it.
      </p>
      <h3>A spreadsheet</h3>
      <p>
        A big step up: the same columns for every trick, sorting and filters. Our{' '}
        <GuideLink slug="magic-trick-list-template">free magic trick list template</GuideLink> is a good start. It gets
        awkward on a phone, setlists become copy-pasted tabs, and props, gigs and invoices end up in other files.
      </p>
      <h3>A general workspace tool</h3>
      <p>
        Database-style note tools can be shaped into almost anything — if you enjoy building systems. You will spend
        evenings designing tables and relations, and you still will not get a practice timer, a packing list generated
        from a setlist or numbered invoices.
      </p>
      <h3>Generic business software</h3>
      <p>
        Invoicing and booking apps handle the money well, but they know nothing about tricks, routines or props. You end
        up with the business side in one place and the magic in another.
      </p>
      <h3>An app built for magicians</h3>
      <p>
        A dedicated tool covers the five jobs with the links between them already made: a trick belongs to routines, a
        routine to gigs, a gig to a client and an invoice, and the props follow along. That is what{' '}
        <Link to="/">Magician Helper</Link> was built for.
      </p>

      <GuideTable
        caption="Which tool covers which job"
        head={['', 'Notes', 'Spreadsheet', 'Workspace tool', 'Business app', 'Magician app']}
        rows={[
          ['Repertoire', 'Basic', 'Good', 'Good', '—', 'Built in'],
          ['Setlists', '—', 'Manual', 'Manual', '—', 'Built in'],
          ['Practice log', '—', 'Manual', 'Manual', '—', 'Built in'],
          ['Gigs and clients', '—', 'Manual', 'Manual', 'Good', 'Built in'],
          ['Quotes and invoices', '—', '—', '—', 'Good', 'Built in'],
          ['Methods hidden', '—', '—', '—', '—', 'Yes'],
        ]}
      />

      <h2 id="checklist">What to look for in an app for magicians</h2>
      <ul>
        <li>
          <strong>Privacy for your methods.</strong> Your data should be visible to your account only, and methods
          hidden on screen until you choose to reveal them.
        </li>
        <li>
          <strong>Phone first.</strong> You consult your repertoire backstage, at the venue, or while a client is on
          the phone. Make sure the app is comfortable on a small screen.
        </li>
        <li>
          <strong>Status for every trick.</strong> To learn, learning, needs polish, performance-ready — it turns a list
          into a practice plan. See <GuideLink slug="organize-your-magic-repertoire">how to organize your repertoire</GuideLink>.
        </li>
        <li>
          <strong>Setlists with running time and props.</strong> Building a 20-minute set should take minutes, not an
          evening.
        </li>
        <li>
          <strong>Bookings and money in the same place.</strong> Fee, deposit, balance and invoice attached to the gig —
          see <GuideLink slug="how-to-invoice-a-magic-show">how to invoice a magic show</GuideLink>.
        </li>
        <li>
          <strong>Import and export.</strong> You should be able to bring your existing list (CSV) and take everything
          with you at any time.
        </li>
        <li>
          <strong>A real free trial.</strong> Try it with your own repertoire and a real gig before paying.
        </li>
      </ul>

      <Tip title="Start with one job">
        <p>
          Do not migrate everything in one evening. Start with your repertoire — even just names and statuses — then add
          your next gig. The rest follows naturally once the first two are in place.
        </p>
      </Tip>

      <h2 id="magician-helper">Where Magician Helper fits</h2>
      <p>
        Magician Helper is a magic helper app for performers who want the five jobs in one place: a{' '}
        <Link to="/magic-trick-organizer">magic trick organizer</Link> with hidden methods, routines that total their
        running time, a practice timer and log, a gig calendar with clients and payments, an automatic packing checklist,
        numbered quotes and invoices in PDF, and calendar sync with Google, Apple and Outlook. It runs in the browser,
        installs on iPhone and Android, and comes with a 14-day free trial without a credit card.
      </p>
    </>
  )
}
