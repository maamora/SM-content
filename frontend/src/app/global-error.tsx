/* STUDIO visual system: utility surfaces stay dark, editorial, and dependency-light so the global recovery frame can render outside the normal app tree. */

"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- global-error renders outside App Router context. */

export default function GlobalError() {
  return (
    <html lang="en">
      <body className="studio-utility">
        <main className="studio-utility__grid">
          <section className="studio-utility__card">
            <span className="studio-kicker">SYSTEM / RECOVERABLE</span>
            <h1>
              The frame
              <br />
              <em>paused.</em>
            </h1>
            <p>
              STUDIO hit an unexpected state. Return to the home canvas and try the current frame again.
            </p>
            <div className="studio-hero__actions">
              <a className="studio-button studio-button--lime studio-button--large" href="/">
                Back to STUDIO
              </a>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
