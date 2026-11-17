import { Link } from 'react-router'
import { GuideLink, GuideTable, Tip } from '../guide-ui'

export function RepertoireGuide() {
  return (
    <>
      <p>
        Most magicians know far more tricks than they perform. Some are in a notebook, some in a drawer with their
        gimmicks, some in a video you bookmarked years ago. When a client asks for a 20-minute set without a table, you
        should be able to build it in minutes — not by searching your memory. Here is a simple system to organize your
        repertoire.
      </p>

      <h2 id="what-to-record">What to record for every trick</h2>
      <p>You do not need to fill everything at once, but these fields are the ones you will actually use:</p>
      <ul>
        <li>
          <strong>Name</strong> — the name you use, and the published name if it is different.
        </li>
        <li>
          <strong>Effect</strong> — what the audience sees, in one or two sentences. This is what you read when
          building a set.
        </li>
        <li>
          <strong>Method</strong> — how it works, kept private (more on that below).
        </li>
        <li>
          <strong>Category</strong> — cards, coins, mentalism, close-up, parlour, stage, children.
        </li>
        <li>
          <strong>Status</strong> — where the trick is in your learning (see the next section).
        </li>
        <li>
          <strong>Duration and reset</strong> — how long it plays and whether it needs a reset between groups.
        </li>
        <li>
          <strong>Difficulty and angles</strong> — can it be done surrounded? Standing? Without a table?
        </li>
        <li>
          <strong>Props</strong> — everything it needs, including consumables like flash paper or rubber bands.
        </li>
        <li>
          <strong>Source and credits</strong> — the book, video or creator you learned it from.
        </li>
        <li>
          <strong>Notes</strong> — patter lines, audience reactions, video references of your own performances.
        </li>
      </ul>

      <h2 id="status">Track where each trick stands</h2>
      <p>
        A trick you watched once and a trick you have performed two hundred times do not belong in the same list.
        Give each one a status:
      </p>
      <GuideTable
        caption="A simple status pipeline"
        head={['Status', 'Meaning']}
        rows={[
          ['To learn', 'Bought, seen or noted — not started.'],
          ['Learning', 'You are working on the method and the moves.'],
          ['Needs polish', 'It works, but the handling, patter or timing is not there yet.'],
          ['Performance-ready', 'You would happily do it for a paying audience tonight.'],
        ]}
      />
      <p>
        Only “performance-ready” tricks go into setlists. The other columns become your practice plan — read{' '}
        <GuideLink slug="how-to-practice-magic">how to practice magic</GuideLink> to move them along.
      </p>

      <h2 id="tags">Tags that actually help</h2>
      <p>Categories describe what a trick is. Tags describe when you can use it. Useful examples:</p>
      <ul>
        <li>Conditions: <em>no table</em>, <em>surrounded</em>, <em>walk-around</em>, <em>needs a chair</em>, <em>loud room</em>.</li>
        <li>Audience: <em>kids-friendly</em>, <em>family</em>, <em>corporate</em>, <em>small group</em>.</li>
        <li>Role in a set: <em>opener</em>, <em>closer</em>, <em>signature</em>, <em>souvenir</em>.</li>
        <li>Practical: <em>instant reset</em>, <em>pocket-only</em>, <em>borrowed object</em>.</li>
      </ul>
      <p>Keep the list short. A tag that you use on one trick is not a tag, it is a note.</p>

      <h2 id="secrets">Keep your methods private</h2>
      <p>
        Your methods are part of your livelihood and often belong to their creators. Do not keep them in a shared
        document whose link might be forwarded, or in a notes app synced to a family account. Use a tool where your
        data is private to your account, and where the method stays hidden on screen until you choose to reveal it — so
        you can open your repertoire in front of a client without exposing anything.
      </p>

      <Tip title="Credit your sources">
        <p>
          Noting where each trick comes from is good practice: it respects creators, helps you find the original
          instructions when you need them, and shows you which books and teachers shaped your style.
        </p>
      </Tip>

      <h2 id="tools">Notebook, spreadsheet or app?</h2>
      <GuideTable
        caption="Ways to store a repertoire"
        head={['Tool', 'Good for', 'Limits']}
        rows={[
          ['Paper notebook', 'Thinking, sketching routines', 'No search, easy to lose, not with you at the gig'],
          ['Spreadsheet', 'Free, sortable', 'Methods visible to anyone who opens it, hard to use on a phone'],
          ['Notes app', 'Always on your phone', 'No statuses or filters; becomes a long scroll'],
          ['Dedicated app', 'Statuses, filters, props, setlists linked together', 'A subscription'],
        ]}
      />

      <p>
        Starting with a spreadsheet? Use the{' '}
        <GuideLink slug="magic-trick-list-template">free magic trick list template</GuideLink>: it has these fields as
        columns and imports into a <Link to="/magic-trick-organizer">magic trick organizer</Link> when you outgrow it.
      </p>

      <h2 id="review">Review it once a month</h2>
      <p>
        Take ten minutes each month to look at your repertoire: which performance-ready tricks you have not performed
        or practiced in a while, which ones are stuck in “needs polish”, and which new ones deserve to start. That small
        habit keeps your best material warm and your sets fresh. When you are ready to put tricks together, read{' '}
        <GuideLink slug="how-to-build-a-magic-setlist">how to build a magic setlist</GuideLink>.
      </p>
    </>
  )
}
