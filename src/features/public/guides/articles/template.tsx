import { Download } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { TRICKS_TEMPLATE_URL } from '@/lib/constants'
import { GuideLink, GuideTable, Tip } from '../guide-ui'

/** Download call to action, in a box that stands out from the article text. */
function DownloadTemplate() {
  return (
    <div className="not-prose my-10 flex flex-col items-start gap-5 rounded-2xl border border-gold/40 bg-gradient-to-b from-accent/60 to-card p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-display text-2xl font-semibold">Magic trick list template</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Free CSV file · Excel, Google Sheets, Numbers, LibreOffice · five example rows
        </p>
      </div>
      <Button asChild size="lg" className="shrink-0">
        <a href={TRICKS_TEMPLATE_URL} download>
          <Download aria-hidden="true" /> Download the template
        </a>
      </Button>
    </div>
  )
}

export function TemplateGuide() {
  return (
    <>
      <p>
        A trick list is the simplest tool a magician can have, and the one most of us neglect. Without it, you forget
        material you already know, you rebuild the same set from memory before every gig, and you buy tricks you
        already own. This free template gives every trick the same structure in a spreadsheet — and it imports straight
        into Magician Helper when you outgrow it.
      </p>

      <DownloadTemplate />

      <h2 id="columns">The columns, and what to write in them</h2>
      <p>
        Twelve columns are enough for a working repertoire. Fill the first one for every trick today; complete the rest
        when you next practice or perform it.
      </p>
      <GuideTable
        caption="Magic trick list columns"
        head={['Column', 'What to write', 'Example']}
        rows={[
          ['name', 'The name you use (add the published name in notes if different).', 'Ambitious Card'],
          ['effect', 'What the audience sees, in one or two sentences.', 'A signed card keeps rising to the top.'],
          ['method', 'How it works and the setup. Keep this file private.', 'Your own notes'],
          ['category', 'Card, Coin, Mentalism, Close-up, Stage or Other — several separated by “;”.', 'Card; Close-up'],
          ['difficulty', '1 Easy · 2 Intermediate · 3 Advanced · 4 Expert.', '2'],
          ['duration_min', 'Running time in minutes.', '5'],
          ['status', 'To learn, Learning, Needs polish or Performance-ready.', 'Performance-ready'],
          ['tags', 'When you can use it, separated by “;”.', 'Opener; Walkaround'],
          ['video_url', 'A link to a video of your performance (https://…).', '—'],
          ['references', 'Book, DVD, download or creator you learned it from.', 'Your source'],
          ['props', 'Everything it needs, including consumables.', 'Deck; Sharpie'],
          ['notes', 'Patter lines, reactions, things to improve.', 'Ends in their hand.'],
        ]}
      />

      <h2 id="status">The status column is the one that matters</h2>
      <p>
        A trick you watched once and a trick you have performed two hundred times should not look the same in your list.
        The status turns the spreadsheet into a plan: filter on <em>Performance-ready</em> to build a set, and on{' '}
        <em>Learning</em> or <em>Needs polish</em> to decide what to practice this week. The{' '}
        <GuideLink slug="organize-your-magic-repertoire">repertoire guide</GuideLink> explains how to move tricks along,
        and <GuideLink slug="how-to-practice-magic">how to practice magic</GuideLink> how to make the practice count.
      </p>

      <h2 id="tags">Tags: when can you perform it?</h2>
      <p>
        Categories say what a trick is; tags say when you can use it — <em>no table</em>, <em>walk-around</em>,{' '}
        <em>family friendly</em>, <em>opener</em>, <em>closer</em>. Keep the list short and consistent: the{' '}
        <GuideLink slug="organize-your-magic-repertoire">repertoire guide</GuideLink> has a ready-made set of tags that
        actually help.
      </p>

      <Tip title="Use semicolons inside a cell">
        <p>
          Put several categories, tags or props in one cell separated by semicolons (<em>Opener; Walkaround</em>). The
          file stays one row per trick, and filters in your spreadsheet still work with “contains”.
        </p>
      </Tip>

      <h2 id="spreadsheet">Opening it in Excel, Google Sheets or Numbers</h2>
      <ul>
        <li>
          <strong>Google Sheets</strong> — File › Import › Upload, then “Replace spreadsheet”.
        </li>
        <li>
          <strong>Excel</strong> — open the file directly. If everything lands in one column, use Data › From Text/CSV
          and choose “Comma” as the delimiter.
        </li>
        <li>
          <strong>Numbers</strong> — drag the file onto the Numbers icon.
        </li>
      </ul>
      <p>
        Freeze the first row, turn on filters, and sort by status. That is already a better system than a notes app.
      </p>

      <h2 id="limits">Where a spreadsheet stops working</h2>
      <p>A sheet is a fine start. After a few dozen tricks, magicians usually hit the same walls:</p>
      <ul>
        <li>
          <strong>Your methods are on screen.</strong> Open the file at a gig and anyone behind you can read them.
        </li>
        <li>
          <strong>Setlists live somewhere else.</strong> Copying rows into another tab and adding durations by hand gets
          old quickly — see <GuideLink slug="how-to-build-a-magic-setlist">how to build a magic setlist</GuideLink>.
        </li>
        <li>
          <strong>Props are just text.</strong> Nothing tells you that the flash paper you need on Saturday ran out.
        </li>
        <li>
          <strong>It is painful on a phone</strong> — which is where you are when a client asks what you can do.
        </li>
      </ul>

      <h2 id="import">Import your list into Magician Helper</h2>
      <p>
        The template uses the exact columns that Magician Helper recognizes. When you are ready, open{' '}
        <em>Tricks › Import CSV</em>, pick your file, check the preview (every row is validated and unknown values are
        flagged before anything is saved) and confirm. Your whole repertoire becomes a private{' '}
        <Link to="/magic-trick-organizer">magic trick organizer</Link>: methods hidden until you tap Reveal, a kanban
        board by status, routines with total running time and gigs with an automatic packing list.
      </p>
      <p>
        Your own column names work too: <em>title</em>, <em>trick</em>, <em>description</em>, <em>secret</em>,{' '}
        <em>credits</em> or <em>minutes</em> are matched automatically, and extra columns are simply ignored.
      </p>

      <DownloadTemplate />
    </>
  )
}
