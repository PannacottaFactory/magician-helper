import { GuideLink, GuideTable, Tip } from '../guide-ui'

export function PricingGuide() {
  return (
    <>
      <p>
        “How much do you charge?” is the question every magician hears and many dread. There is no universal rate:
        prices vary with your city, your experience, the type of event and how much demand you have. What you can have
        is a <strong>method</strong> — one that tells you your minimum, places you in your market and lets you answer
        with confidence.
      </p>

      <h2 id="floor">1. Start with your minimum fee</h2>
      <p>
        Before looking at anyone else’s prices, work out the fee below which a gig costs you money. You need three
        numbers:
      </p>
      <ul>
        <li>
          <strong>Your yearly costs</strong> — props and consumables, insurance, website, travel, costumes, training,
          software, accountant.
        </li>
        <li>
          <strong>The income you want to keep</strong> after costs, taxes and social contributions.
        </li>
        <li>
          <strong>The number of paid gigs</strong> you can realistically book in a year — be honest, not optimistic.
        </li>
      </ul>
      <GuideTable
        caption="Example: a part-time close-up magician"
        head={['Item', 'Per year']}
        rows={[
          ['Costs (props, insurance, website, travel, software…)', '€5,000'],
          ['Taxes and social contributions (example: ~25% of revenue)', '€5,000'],
          ['Income you want to keep', '€10,000'],
          [<strong key="t">Revenue needed</strong>, <strong key="v">€20,000</strong>],
          ['Gigs you can realistically book', '40'],
          [<strong key="m">Minimum average fee</strong>, <strong key="v">€500 per gig</strong>],
        ]}
      />
      <p>
        These numbers are only an illustration — plug in your own. The result is not your price; it is your floor. If
        the market in your area pays less than that, you need more gigs, lower costs or a different type of client.
      </p>

      <h2 id="hours">2. Count the real hours behind a set</h2>
      <p>
        A one-hour set is never one hour of work. Add the emails and calls with the client, preparing the quote,
        rehearsing, packing, travelling, arriving early, setting up, performing, packing up, driving home, invoicing and
        following up. For a local gig, five or six hours in total is common; for a distant one, it can be a full day.
        Divide your fee by that real total before you decide a price is “a lot for an hour”.
      </p>

      <h2 id="market">3. Place yourself in your market</h2>
      <p>
        Look at what other performers in your area charge for similar work — their websites, entertainment agencies,
        wedding directories. Note where the beginners are, where the established names are, and where you honestly sit
        between them. Underpricing is rarely a winning strategy: it attracts clients who negotiate hardest and makes it
        harder to raise your rates later.
      </p>

      <h2 id="adjust">4. Adjust for the event</h2>
      <ul>
        <li>
          <strong>Type of client</strong> — corporate events usually carry bigger budgets than private parties.
        </li>
        <li>
          <strong>Date</strong> — Saturdays in wedding season and December party nights are in high demand.
        </li>
        <li>
          <strong>Audience size</strong> — for close-up, more guests means more time to reach every group.
        </li>
        <li>
          <strong>Travel and accommodation</strong> — charge them as separate lines.
        </li>
        <li>
          <strong>Custom work</strong> — a bespoke routine with the client’s product or logo is worth far more than a
          standard set.
        </li>
        <li>
          <strong>Short notice</strong> — a booking for next weekend can carry a premium.
        </li>
      </ul>

      <h2 id="packages">5. Offer packages, not a single price</h2>
      <p>
        Three clear options help clients choose instead of negotiate. For example: <strong>Essential</strong> (one hour of
        close-up), <strong>Signature</strong> (two hours of close-up plus a 20-minute parlour show) and{' '}
        <strong>Premium</strong> (Signature plus a personalised routine). Many clients pick the middle option, and the
        top one makes it look reasonable.
      </p>

      <Tip title="When someone asks for a discount">
        <p>
          Trade something instead of cutting the price: a shorter set, a weekday date, no travel. Your rate stays the
          same, and the next client will not hear about a “special price”.
        </p>
      </Tip>

      <h2 id="quote">6. Write a quote that gets accepted</h2>
      <p>A good quote answers the client’s questions before they ask them:</p>
      <ul>
        <li>Event date, times, venue and number of guests.</li>
        <li>What is included — type of magic, number and length of sets, equipment.</li>
        <li>The price, line by line, with tax if you charge it.</li>
        <li>The deposit required to hold the date, and when the balance is due.</li>
        <li>How long the quote is valid — 30 days is common.</li>
        <li>Your cancellation terms and any technical needs (space, light, microphone).</li>
      </ul>
      <p>
        Send it quickly — the first professional quote in the inbox has a head start — and follow up a few days later.
        When the client accepts, the same details become your invoice: see{' '}
        <GuideLink slug="how-to-invoice-a-magic-show">how to invoice a magic show</GuideLink>.
      </p>

      <h2 id="raise">7. Raise your prices regularly</h2>
      <p>
        If you are turning down dates, your price is too low. Raise it for new enquiries, keep the quotes already sent,
        and review your rates once a year as your costs and experience grow. Track the fee of every gig: after a season
        you will see exactly which events pay best for the time they take.
      </p>
    </>
  )
}
