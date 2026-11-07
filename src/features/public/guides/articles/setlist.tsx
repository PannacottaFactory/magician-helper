import { GuideLink, GuideTable, Tip } from '../guide-ui'

export function SetlistGuide() {
  return (
    <>
      <p>
        Strong tricks do not automatically make a strong show. The order, the variety and the transitions between them
        decide whether the audience feels a journey or a list. Here is how to build a magic setlist that flows, whatever
        the format.
      </p>

      <h2 id="opener">The opener: quick, visual, safe</h2>
      <p>
        The first minute tells the audience who you are and that they are in good hands. A good opener is short, visual,
        easy to follow and very reliable — it is not the moment for your riskiest piece. It should also get you into
        position: deck in hand, spectators engaged, attention on you.
      </p>

      <h2 id="closer">The closer: your strongest piece</h2>
      <p>
        People remember the end. Close with the trick that gets the biggest reaction, ideally one with a clear, visual
        climax that tells everyone the show is over. A souvenir — a signed card, a folded bill — keeps the memory alive
        after you leave and often brings bookings.
      </p>

      <h2 id="middle">The middle: variety and rhythm</h2>
      <p>Between the two, vary as many things as you can:</p>
      <ul>
        <li>
          <strong>The type of effect</strong> — a production, a vanish, a transformation, a prediction, a restoration.
          Three transpositions in a row feel like the same trick three times.
        </li>
        <li>
          <strong>The objects</strong> — cards, coins, borrowed items, the spectators’ own thoughts.
        </li>
        <li>
          <strong>The tone</strong> — a funny piece, then a quieter, more mysterious one.
        </li>
        <li>
          <strong>Participation</strong> — involve different spectators, and give your best helper the biggest moment.
        </li>
      </ul>

      <h2 id="transitions">Plan the transitions</h2>
      <p>
        The gap between two tricks is where shows lose energy. For each pair, ask: where are my props? What do I need
        in my hands for the next effect? Can I set it up during the applause or while talking? Order tricks so that the
        end of one leaves you ready for the next, and write your transition lines down like any other patter.
      </p>

      <Tip title="Count your reset time">
        <p>
          For walk-around and table-hopping, a set you perform for many groups must reset in seconds, or fit in a
          pocket you can reset discreetly. Note the reset time of each trick in your repertoire.
        </p>
      </Tip>

      <h2 id="formats">Adapt the length to the format</h2>
      <GuideTable
        caption="Typical set lengths (they vary with each event)"
        head={['Format', 'Typical set', 'Notes']}
        rows={[
          ['Walk-around / table-hopping', '5–10 min per group', 'Standing, no table, instant reset'],
          ['Close-up at a table', '15–30 min', 'Small audience, more intimate pieces'],
          ['Parlour', '20–45 min', 'Seated audience, volunteers come up'],
          ['Stage', '30–60 min', 'Visible from the back row, music and lights'],
          ['Children’s show', '30–45 min', 'Short pieces, lots of participation, simple plots'],
        ]}
      />

      <h2 id="example">An example 20-minute parlour set</h2>
      <GuideTable
        caption="Example setlist"
        head={['#', 'Piece', 'Role', 'Time']}
        rows={[
          ['1', 'A quick, visual change with a borrowed object', 'Opener', '2 min'],
          ['2', 'A card routine with a chosen spectator', 'Build trust', '5 min'],
          ['3', 'A comedy piece with a volunteer on stage', 'Lighten the room', '5 min'],
          ['4', 'A quiet mind-reading moment', 'Change of tone', '4 min'],
          ['5', 'A prediction revealed from a sealed envelope', 'Closer', '4 min'],
        ]}
      />

      <h2 id="variants">Keep variants ready</h2>
      <p>
        Build a short and a long version of your main set, a version with no table, and a family-friendly version. When
        a client changes the plan on the day — “can you do ten minutes instead of twenty?” — you already know what to
        cut.
      </p>

      <h2 id="refine">Test and refine</h2>
      <p>
        After each show, note the reactions and the timing. Move pieces around, replace the one that always gets a
        polite smile, and record a full set from time to time. Only use tricks that are truly performance-ready (see{' '}
        <GuideLink slug="organize-your-magic-repertoire">how to organize your repertoire</GuideLink>), and run the full set
        before the gig — the <GuideLink slug="magic-show-checklist">gig checklist</GuideLink> reminds you when.
      </p>
    </>
  )
}
