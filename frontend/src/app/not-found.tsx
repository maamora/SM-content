import Link from "next/link";

export default function NotFound() {
  return <main className="studio-utility"><div className="studio-utility__grid"><Link href="/" className="studio-utility__back">← STUDIO</Link><section className="studio-utility__card"><span className="studio-kicker">404 / OUT OF FRAME</span><h1>This page<br /><em>moved.</em></h1><p>The route you followed is not part of this current creative system. Return to the workspace and pick another thread.</p><Link href="/" className="studio-button studio-button--lime studio-button--large">Back to STUDIO</Link></section><span className="studio-utility__foot">STUDIO / Creative operations in motion</span></div></main>;
}
