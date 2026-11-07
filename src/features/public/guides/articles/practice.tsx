import { GuideLink, GuideTable, Tip } from '../guide-ui'

export function PracticeGuide() {
  return (
    <>
      <p>
        Every magician practices. Fewer practice in a way that makes them visibly better month after month. The
        difference is rarely talent or hours — it is structure: knowing what you are working on, practicing it
        correctly, and keeping track. Here is a practice routine you can actually keep.
      </p>

      <h2 id="practice-vs-rehearsal">Practice and rehearsal are not the same thing</h2>
      <ul>
        <li>
          <strong>Practice</strong> is working on the parts: a sleight, a move, a piece of handling, until it is
          invisible and automatic.
        </li>
        <li>
          <strong>Rehearsal</strong> is performing the whole piece as the audience will see it: patter, timing,
          movement, props, audience management, from the first word to the applause.
        </li>
      </ul>
      <p>
        Many magicians only practice, then discover on stage that the trick does not fit their words or their hands are
        full at the wrong moment. You need both.
      </p>

      <h2 id="short-sessions">Short, regular sessions beat rare marathons</h2>
      <p>
        Twenty to forty-five focused minutes most days will take you further than four hours on a Sunday. Moves settle in
        between sessions, and a short session is easier to start on a busy day. Pick a fixed moment — after breakfast, or
        before you open your emails — and protect it.
      </p>

      <h2 id="session">A structure for each session</h2>
      <GuideTable
        caption="A 30-minute practice session"
        head={['Time', 'What you do']}
        rows={[
          ['5 min', 'Warm-up: shuffles, flourishes or basic moves to loosen your hands.'],
          ['10 min', 'One weakness: a single move or moment, slowly, then at full speed.'],
          ['10 min', 'Put it back in context: the full trick, with the patter, at performance pace.'],
          ['5 min', 'Run a trick you already know so it stays sharp, then write two lines in your log.'],
        ]}
      />
      <p>
        The key is the second block. Practicing what you already do well feels good and changes nothing. Choose the move
        that you would not want a spectator to see from the side, and work on that.
      </p>

      <h2 id="camera">Camera or mirror?</h2>
      <p>
        A mirror shows you a reversed image and pulls your eyes to your hands, which is exactly where you do not want
        to look during a performance. A phone camera on a stand is a better coach: record at audience height, from the
        front and from the sides, then watch it back once with the sound off. You will spot flashes, tells and tension
        you never feel while performing.
      </p>

      <h2 id="log">Keep a practice log</h2>
      <p>A log turns practice into progress you can see. For each session, write down:</p>
      <ul>
        <li>The date and how long you practiced.</li>
        <li>The tricks you worked on.</li>
        <li>What went well, and the flaws you noticed — specific, like “the double lift is slow on the second phase”.</li>
        <li>A rating out of five, to see your progress over weeks.</li>
      </ul>
      <p>
        Next session, start by reading your last entry. You will know exactly what to work on instead of starting from
        the trick you feel like doing.
      </p>

      <Tip title="Watch for cold tricks">
        <p>
          A trick you have not touched for two months is not performance-ready anymore, even if it was. A log shows you
          which tricks have gone cold, so you can run them before you put them in a setlist.
        </p>
      </Tip>

      <h2 id="rehearse">Rehearse like it is the show</h2>
      <ul>
        <li>Say every word out loud, at the volume you will use.</li>
        <li>Use the real props, in the pockets or case you will use on the day.</li>
        <li>Time the set — routines always run longer in front of people.</li>
        <li>Rehearse in your performing clothes at least once: pockets change everything.</li>
        <li>Then try it on friends, family or an open mic before a paying audience.</li>
      </ul>

      <h2 id="mistakes">Common mistakes</h2>
      <ul>
        <li>Practicing a move wrong many times — you are training the mistake. Slow down until it is right.</li>
        <li>Only practicing new tricks, while the ones you perform every week get sloppy.</li>
        <li>Practicing the method without the patter, then improvising words on stage.</li>
        <li>Not writing anything down, and relearning the same lesson every month.</li>
      </ul>
      <p>
        Structure your practice around your repertoire statuses (see{' '}
        <GuideLink slug="organize-your-magic-repertoire">how to organize your repertoire</GuideLink>) and you will always
        know what to practice next.
      </p>
    </>
  )
}
