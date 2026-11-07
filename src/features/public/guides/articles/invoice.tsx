import { GuideLink, GuideTable, Tip } from '../guide-ui'

export function InvoiceGuide() {
  return (
    <>
      <p>
        You did the hard part: the show went well, the client was delighted. Now comes the part most magicians put off —
        the invoice. Yet a clear invoice is what gets you paid on time, keeps your accounts straight and makes you look
        like the professional you are. Here is exactly what to put on it, with a worked example.
      </p>

      <h2 id="what-to-include">What to include on a magic show invoice</h2>
      <p>The legal requirements depend on your country, but a complete invoice almost always contains:</p>
      <ul>
        <li>
          <strong>Your details</strong> — your legal name (and stage name if you use one), address, email and, where
          your country requires it, your business registration or tax number.
        </li>
        <li>
          <strong>The client’s details</strong> — the exact name of the person or company that pays, their billing
          address, and for companies the purchase order (PO) number if they gave you one.
        </li>
        <li>
          <strong>A unique invoice number</strong> — sequential and without gaps, for example INV-2026-0042.
        </li>
        <li>
          <strong>The issue date and the performance date</strong>, plus the venue or event name, so the client’s
          accounts department can match it to the booking.
        </li>
        <li>
          <strong>A clear description of the service</strong> — not just “Magic show”, but “Strolling close-up magic
          during the cocktail reception, 2 × 45-minute sets, 80 guests”.
        </li>
        <li>
          <strong>Line items with prices</strong> — the performance fee, travel, accommodation, extra sets, sound
          equipment, bespoke content.
        </li>
        <li>
          <strong>Tax</strong> — the tax rate and amount if you charge VAT or sales tax, or the exemption mention your
          country requires if you do not.
        </li>
        <li>
          <strong>Deposit and balance</strong> — the deposit already received (with its date) and the balance still
          due.
        </li>
        <li>
          <strong>Payment terms</strong> — due date, accepted payment methods, your bank details or a payment link,
          and late-payment terms where they are mandatory.
        </li>
      </ul>

      <h2 id="example">An example invoice</h2>
      <p>
        Here is how the body of an invoice for a corporate event could look. The amounts are only an example; your own
        prices depend on your market (see <GuideLink slug="how-much-to-charge-for-a-magic-show">how to price your shows</GuideLink>).
      </p>
      <GuideTable
        caption="Invoice INV-2026-0042 — Annual dinner, March 21, 2026"
        head={['Description', 'Qty', 'Unit price', 'Amount']}
        rows={[
          ['Strolling close-up magic, cocktail reception (45 min)', '2', '€300.00', '€600.00'],
          ['Stage mentalism act, after dinner (25 min)', '1', '€450.00', '€450.00'],
          ['Travel (round trip, 140 km)', '1', '€70.00', '€70.00'],
          [<strong key="t">Total</strong>, '', '', <strong key="v">€1,120.00</strong>],
          ['Deposit received on January 10, 2026', '', '', '−€400.00'],
          [<strong key="b">Balance due by April 4, 2026</strong>, '', '', <strong key="v">€720.00</strong>],
        ]}
      />
      <p>
        Below the table, add the tax line or exemption mention, your bank details or payment link, and a one-line
        thank-you. That last line costs nothing and is remembered when the client books their next event.
      </p>

      <h2 id="deposits">Deposits: hold the date, protect your calendar</h2>
      <p>
        Many performers ask for a deposit when the booking is confirmed — often between 25% and 50% of the fee. It turns
        a verbal “yes” into a commitment and covers you if the event is cancelled late. You can either send a separate
        deposit invoice when the client accepts your quote, then a final invoice for the balance, or send a single
        invoice that shows the deposit as already paid, as in the example above.
      </p>
      <p>
        Whatever you choose, write the deposit amount and the cancellation terms in the quote first, so there is no
        surprise on the invoice.
      </p>

      <h2 id="numbering">Numbering and record keeping</h2>
      <ul>
        <li>Use one continuous sequence, for example by year: INV-2026-0001, INV-2026-0002…</li>
        <li>Never reuse or skip a number, and never delete an invoice that was sent.</li>
        <li>
          To correct a sent invoice, issue a credit note that cancels it, then a new invoice. Do not edit the original.
        </li>
        <li>
          Keep a copy of every invoice for as long as your country requires — often several years (ten in France, for
          example).
        </li>
      </ul>

      <h2 id="tax">Tax mentions</h2>
      <p>
        If you are registered for VAT or sales tax, show the rate, the amount before tax and the total with tax. If you
        are under a small-business threshold, some countries require a specific sentence on every invoice — in France,
        for example, “TVA non applicable, article 293 B du CGI”. The rules vary a lot from one country to another, so
        check with your tax office or an accountant once, then let your invoice template repeat it every time.
      </p>

      <Tip title="Corporate clients">
        <p>
          Ask, at booking time, who processes invoices and whether they need a purchase order number. An invoice
          without a PO number can sit unpaid for weeks in an accounts department.
        </p>
      </Tip>

      <h2 id="when">When to send it</h2>
      <ul>
        <li>
          <strong>Corporate events</strong> — deposit invoice right after the booking, final invoice the day after the
          event, with payment within 15 to 30 days.
        </li>
        <li>
          <strong>Private events</strong> (weddings, birthdays) — many magicians ask for the balance before or on the
          day of the show, so nobody has to chase anyone after the party.
        </li>
      </ul>
      <p>Whichever you choose, write it in the quote so the client knows what to expect.</p>

      <h2 id="mistakes">Mistakes that delay payment</h2>
      <ul>
        <li>A vague description that the client’s accountant cannot match to a booking.</li>
        <li>The wrong legal name for the client (the brand name instead of the company that actually pays).</li>
        <li>No due date, so “later” becomes “never”.</li>
        <li>An editable document instead of a PDF.</li>
        <li>No follow-up: a polite reminder a few days after the due date solves most late payments.</li>
      </ul>

      <h2 id="summary">In short</h2>
      <p>
        A good magic show invoice is boring in the best way: every piece of information is there, numbered and dated,
        with the deposit, the balance and the way to pay. Set it up once as a template, and invoicing becomes a
        two-minute job after each gig. If you also want a checklist for everything else around the show, read{' '}
        <GuideLink slug="magic-show-checklist">the magician’s gig checklist</GuideLink>.
      </p>
    </>
  )
}
