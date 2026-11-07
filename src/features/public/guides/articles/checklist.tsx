import { GuideLink, Tip } from '../guide-ui'

export function ChecklistGuide() {
  return (
    <>
      <p>
        Most gig disasters are not about the magic. They are about a wrong address, a missing deck, a room with no
        light, or a client who expected a 45-minute show when you prepared 20. A checklist removes all of that. Here is
        the one we recommend, from the first call to the follow-up email.
      </p>

      <h2 id="booking">When you take the booking</h2>
      <p>Ask these questions on the first call and write the answers down:</p>
      <ul>
        <li>Date, start time and how long they want you to perform.</li>
        <li>Venue address, the room, and where to park and unload.</li>
        <li>The name and phone number of the contact on the day — often not the person who booked you.</li>
        <li>The type of event and audience: corporate, wedding, birthday; adults or children; number of guests.</li>
        <li>What kind of magic: walk-around, close-up at tables, a parlour or stage show.</li>
        <li>Space, lighting, sound and whether there will be a microphone.</li>
        <li>Dress code and any theme.</li>
        <li>What else is happening: speeches, meal service, a band — so your sets do not clash.</li>
        <li>The fee, the deposit and when the balance is due.</li>
      </ul>
      <p>
        Then send a quote that repeats those details (see{' '}
        <GuideLink slug="how-much-to-charge-for-a-magic-show">how to price and quote a show</GuideLink>) and block the date
        once the deposit is in.
      </p>

      <h2 id="week-before">The week before</h2>
      <ul>
        <li>Confirm the times, address and on-site contact with the client.</li>
        <li>Choose your setlist and run it at least once in full.</li>
        <li>Check consumables: cards, flash paper, rubber bands, rope, envelopes, pens, sharpies, batteries.</li>
        <li>Plan the route and travel time, with a margin for traffic.</li>
        <li>Print or download a show sheet: venue, contact, times, running order and packing list on one page.</li>
      </ul>

      <h2 id="day-before">The day before: pack</h2>
      <ul>
        <li>Pack from your setlist, trick by trick, so nothing is forgotten.</li>
        <li>Add spares: a second deck, extra consumables, a backup trick that needs nothing.</li>
        <li>Charge everything: phone, microphone, speaker, lights.</li>
        <li>Prepare your clothes and plan your pocket management.</li>
        <li>Bring business cards and, if needed, the invoice for the balance.</li>
      </ul>

      <Tip title="Build your packing list from your routines">
        <p>
          If each trick in your repertoire lists its props, your packing list writes itself: add the routines of the
          gig, and you get every item to bring, with a warning for consumables you are running out of.
        </p>
      </Tip>

      <h2 id="on-the-day">On the day</h2>
      <ul>
        <li>Arrive early — 45 minutes to an hour is a comfortable margin for most events.</li>
        <li>Find your contact, confirm the timings and any last-minute changes.</li>
        <li>Check the space: light, angles, noise, where people will stand or sit.</li>
        <li>Set up and reset everything, then put your phone on silent.</li>
        <li>Keep water nearby and know where you can reset between sets.</li>
      </ul>

      <h2 id="after">After the show</h2>
      <ul>
        <li>Reset your props and note what needs restocking.</li>
        <li>Write a few lines about what worked, what did not, and how the audience reacted.</li>
        <li>Send a thank-you message to the client the next day.</li>
        <li>Ask for a review or a referral while the event is fresh in their memory.</li>
        <li>
          Send the invoice or confirm the balance has been paid (see{' '}
          <GuideLink slug="how-to-invoice-a-magic-show">how to invoice a magic show</GuideLink>).
        </li>
        <li>Record the fee and the client’s details for next year’s event.</li>
      </ul>

      <h2 id="make-it-yours">Make it yours</h2>
      <p>
        Copy this list into the tool you use every day and adapt it to your act: a children’s entertainer will add
        balloons and a sound system, a stage illusionist will add load-in times and crew. The point is to never rely on
        memory the night before a show.
      </p>
    </>
  )
}
