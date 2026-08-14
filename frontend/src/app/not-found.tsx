/* eslint-disable @next/next/no-html-link-for-pages -- not-found must remain context-independent during prerender. */

export default function NotFound() {
  return <main className="studio-utility"><div className="studio-utility__grid"><a href="/" className="studio-utility__back">← STUDIO</a><section className="studio-utility__card"><span className="studio-kicker">404 / OUT OF FRAME</span><h1>This page<br /><em>moved.</em></h1><p>The route you followed is not part of this current creative system. Return to the workspace and pick another thread.</p><a href="/" className="studio-button studio-button--lime studio-button--large">Back to STUDIO</a></section><span className="studio-utility__foot">STUDIO / Creative operations in motion</span></div></main>;
}
