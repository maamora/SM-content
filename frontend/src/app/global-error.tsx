"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return <html lang="en"><body className="studio-utility"><main className="studio-utility__grid"><section className="studio-utility__card"><span className="studio-kicker">SYSTEM / RECOVERABLE</span><h1>The frame<br /><em>paused.</em></h1><p>STUDIO hit an unexpected state. Try the current frame again or return to the home canvas.</p><div className="studio-hero__actions"><button className="studio-button studio-button--lime studio-button--large" onClick={() => reset()}>Try again</button><a className="studio-button studio-button--outline studio-button--large" href="/">Back to STUDIO</a></div></section></main></body></html>;
}
