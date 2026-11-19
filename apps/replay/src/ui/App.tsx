/**
 * HUMAN-OWNED (designer): the Pen replay page. This is the piece recruiters will click.
 *
 * What's here is a deliberately bare placeholder that proves the data loads: a raw event
 * list and the final receipts. Replace all of it with the real experience — two lanes,
 * preflight cards with the mud score dropping, a handoff moving between lanes with its
 * approval, a receipts panel, and play / pause / step controls.
 *
 * You get a fully parsed `session` (see ../data/timeline.ts) and `receipts(events, upTo)`
 * for running totals at any step. See docs/build-it-yourselves.md.
 */
import { receipts, type Session } from "../data/timeline";

export function App({ session }: { session: Session }) {
  const totals = receipts(session.events);
  return (
    <main style={{ padding: "calc(var(--pp-space) * 3)" }}>
      <h1>{session.config.name} · Pen replay</h1>
      <p>Placeholder. The designer builds the real replay here.</p>
      <ol>
        {session.events.map((e, i) => (
          <li key={i}>
            <code>
              {e.ts} · {e.member} · {e.event}
            </code>
          </li>
        ))}
      </ol>
      <pre>{JSON.stringify(totals, null, 2)}</pre>
    </main>
  );
}
