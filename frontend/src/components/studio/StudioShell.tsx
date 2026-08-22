"use client";

"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";
import { requestPasswordRecovery, resetPassword } from "@/lib/api/auth";

export const studioImages = {
  mark: "/studio/logo-mark.png",
  hero: "/studio/hero-canvas.png",
  model: "/studio/model-portrait.png",
};

const marketingLinks = [
  ["Features", "/features"],
  ["How it works", "/how-it-works"],
  ["Pricing", "/pricing"],
  ["About", "/about"],
] as const;

export function StudioMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className={`studio-mark ${compact ? "studio-mark--compact" : ""}`} aria-label="STUDIO home">
      <Image src={studioImages.mark} alt="" width={compact ? 28 : 38} height={compact ? 28 : 38} priority className="studio-mark__image" />
      <span className="studio-mark__word">STUDIO</span>
    </Link>
  );
}

export function StudioHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="studio-header">
      <div className="studio-shell studio-header__inner">
        <StudioMark />
        <nav className={`studio-header__nav ${open ? "is-open" : ""}`} aria-label="Primary navigation">
          {marketingLinks.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
          <Link href="/contact" onClick={() => setOpen(false)}>Contact</Link>
        </nav>
        <div className="studio-header__actions">
          <Link href="/login" className="studio-button studio-button--quiet">Sign in</Link>
          <Link href="/register" className="studio-button studio-button--lime">Open Studio <ArrowUpRight size={15} /></Link>
          <button className="studio-menu-button" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">{open ? <X size={19} /> : <Menu size={19} />}</button>
        </div>
      </div>
    </header>
  );
}

export function StudioFooter() {
  return (
    <footer className="studio-footer">
      <div className="studio-shell studio-footer__top">
        <div><StudioMark compact /><p>Creative operations for teams that refuse to publish the ordinary.</p></div>
        <div className="studio-footer__links">
          <div><span>Explore</span><Link href="/features">Features</Link><Link href="/pricing">Pricing</Link><Link href="/how-it-works">How it works</Link></div>
          <div><span>Company</span><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/legal">Legal</Link></div>
          <div><span>Workspace</span><Link href="/login">Sign in</Link><Link href="/register">Create account</Link><Link href="/dashboard">Dashboard</Link></div>
        </div>
      </div>
      <div className="studio-shell studio-footer__bottom"><span>© 2026 STUDIO / a living production system</span><span>Made for the next draft.</span></div>
    </footer>
  );
}

export const marketingData = {
  features: { eyebrow: "THE SYSTEM", title: "Everything your creative process needs", accent: "in one moving surface.", body: "A focused suite for teams making more than one thing at a time.", items: [["Generative canvas", "Turn prompts into visual families with a point of view.", "01"], ["Language system", "Keep copy, captions, and context moving together.", "02"], ["Publishing control", "Approve, adapt, and ship without losing the original direction.", "03"]] },
  "how-it-works": { eyebrow: "THE METHOD", title: "A clearer path from thought", accent: "to output.", body: "STUDIO gives the middle of creative work a visible shape.", items: [["Bring the signal", "Start with the brief, mood, or rough idea already in your head.", "01"], ["Build the family", "Generate considered variants, then refine the one with energy.", "02"], ["Move it forward", "Translate, batch, approve, and publish from the same thread.", "03"]] },
  pricing: { eyebrow: "THE PLAN", title: "A workspace that scales", accent: "with the ambition.", body: "Start with the tools you need now, then expand when the work calls for it.", items: [["Solo", "For one maker shaping a clearer creative practice.", "$0"], ["Team", "For small teams moving in a shared visual language.", "$29"], ["Studio", "For ambitious systems that need more control.", "Talk to us"]] },
  about: { eyebrow: "THE WHY", title: "Creative work is a system", accent: "before it is a file.", body: "STUDIO exists for the teams doing the thinking between the brief and the publish button.", items: [["We value taste", "More directions do not help if none of them feel intentional.", "A"], ["We value motion", "The best systems make the next move feel obvious.", "B"], ["We value context", "Good creative gets stronger when the why stays attached.", "C"]] },
  contact: { eyebrow: "THE CONVERSATION", title: "Bring us the", accent: "interesting problem.", body: "Tell us what your team is trying to make, and we will show you where STUDIO can take some weight off.", items: [["Creative teams", "Build a more expressive operating rhythm.", "01"], ["Brand teams", "Keep every market moving in one direction.", "02"], ["Studios", "Scale the output without flattening the point of view.", "03"]] },
} as const;

export function MarketingPage({ slug }: { slug: keyof typeof marketingData }) {
  const data = marketingData[slug];
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject = encodeURIComponent("STUDIO / New conversation");
    const body = encodeURIComponent(`Reply to: ${email}\n\n${message}`);
    window.location.assign(`mailto:hello@studio.local?subject=${subject}&body=${body}`);
    setSent(true);
  };
  return (
    <main className="studio-site studio-page"><StudioHeader />
      <section className="studio-page-hero studio-starfield"><div className="studio-shell studio-page-hero__inner"><p className="studio-kicker">{data.eyebrow} / STUDIO</p><h1>{data.title}<br /><em>{data.accent}</em></h1><p>{data.body}</p>
        {slug === "contact" ? <form className="studio-contact-form" onSubmit={submit}><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@team.com" aria-label="Email" /><textarea required value={message} onChange={(event) => setMessage(event.target.value)} placeholder="What are you trying to make?" aria-label="Message" rows={4} /><button className="studio-button studio-button--lime" type="submit">Start the conversation <ArrowUpRight size={15} /></button>{sent && <p className="studio-contact-form__status">Your email app has been opened with the conversation drafted. Send it when you are ready.</p>}</form> : <div className="studio-page-hero__actions"><Link href="/register" className="studio-button studio-button--lime studio-button--large">Explore STUDIO <ArrowUpRight size={16} /></Link>{slug === "pricing" && <a href="mailto:hello@studio.local?subject=STUDIO%20/%20Pricing%20conversation" className="studio-button studio-button--outline studio-button--large">Talk about Studio</a>}</div>}
      </div></section>
      <section className="studio-light-section studio-page-grid-section"><div className="studio-shell studio-page-grid">{data.items.map(([title, text, index]) => <article key={title} className="studio-page-card"><span className="studio-page-card__index">{index}</span><h2>{title}</h2><p>{text}</p><ArrowRight size={17} /></article>)}</div><div className="studio-shell studio-page-proof"><span>STUDIO METHOD</span><p>Every surface keeps the hand-off visible: <b>source</b> → <b>direction</b> → <b>approval</b> → <b>delivery</b>.</p></div></section>
      <StudioFooter />
    </main>
  );
}

export function LegalPage() {
  const sections = [
    ["Product boundary", "STUDIO creates local SVG template compositions from the product and copy selected in your workspace. It does not present those compositions as AI photography."],
    ["Your workspace", "You remain responsible for the product references, brand assets, captions, and publishing permissions you add to STUDIO."],
    ["Connected channels", "Social delivery becomes available only after an OAuth connection is configured. Until then, STUDIO shows the connection as unavailable rather than simulating publication."],
    ["Contact", "For product and account questions, use the contact page to open a drafted email from your own email application."],
  ];
  return <main className="studio-site studio-page"><StudioHeader /><section className="studio-page-hero studio-starfield"><div className="studio-shell studio-page-hero__inner"><p className="studio-kicker">STUDIO / PRODUCT NOTICE</p><h1>Clear tools need<br /><em>clear boundaries.</em></h1><p>This short product notice explains what STUDIO does today and how core workspace data is treated in the interface.</p></div></section><section className="studio-light-section studio-page-grid-section"><div className="studio-shell studio-legal-grid">{sections.map(([title, body], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><h2>{title}</h2><p>{body}</p></article>)}</div></section><StudioFooter /></main>;
}

export function UtilityPage({ title, body, action = "Continue" }: { title: string; body: string; action?: string }) {
  const [complete, setComplete] = useState(false);
  return <main className="studio-utility"><div className="studio-utility__grid"><Link href="/" className="studio-utility__back">← STUDIO</Link><div className="studio-utility__card"><StudioMark /><span className="studio-kicker studio-kicker--dark">STUDIO / NEXT STEP</span><h1>{title}</h1><p>{body}</p><button className="studio-button studio-button--lime studio-button--large" onClick={() => setComplete(true)}>{complete ? "You are all set" : action} <ArrowUpRight size={16} /></button><div className="studio-utility__progress"><span /><span /><span className={complete ? "is-active" : ""} /></div></div><span className="studio-utility__foot">A living production system for the next draft.</span></div></main>;
}

export function RecoveryPage({ mode }: { mode: "forgot" | "reset" }) {
  const isForgot = mode === "forgot";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!isForgot && password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }
    const token = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("token");
    if (!isForgot && !token) {
      setError("This reset link is incomplete. Request a fresh link to continue.");
      return;
    }
    setLoading(true);
    try {
      const result = isForgot ? await requestPasswordRecovery(email) : await resetPassword(token!, password);
      setStatus(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not complete that request. Try again.");
    } finally {
      setLoading(false);
    }
  };
  return <main className="studio-utility"><div className="studio-utility__grid"><Link href="/" className="studio-utility__back">← STUDIO</Link><div className="studio-utility__card"><StudioMark /><span className="studio-kicker studio-kicker--dark">STUDIO / NEXT STEP</span><h1>{isForgot ? "Find your way back in." : "A fresh start for the workspace."}</h1><p>{isForgot ? "Enter the email attached to your workspace. If it exists, we will send one secure reset link." : "Choose and confirm a new password for the next draft."}</p><form className="studio-auth-form" onSubmit={submit}>{isForgot ? <label>Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@team.com" autoComplete="email" disabled={loading || Boolean(status)} /></label> : <><label>New password<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8 characters minimum" autoComplete="new-password" disabled={loading || Boolean(status)} /></label><label>Confirm password<input required minLength={8} type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Repeat your password" autoComplete="new-password" disabled={loading || Boolean(status)} /></label></>}{error && <p className="studio-form-error" role="alert">{error}</p>}{status && <p className="studio-form-success" role="status">{status}</p>}{!status && <button disabled={loading} className="studio-button studio-button--lime studio-button--large" type="submit">{loading ? "Working…" : isForgot ? "Send reset link" : "Set new password"} <ArrowUpRight size={16} /></button>}{status && <Link href={isForgot ? "/login" : "/login"} className="studio-button studio-button--outline studio-button--large">Back to sign in <ArrowUpRight size={16} /></Link>}</form><div className="studio-utility__progress"><span /><span /><span className={status ? "is-active" : ""} /></div></div><span className="studio-utility__foot">A living production system for the next draft.</span></div></main>;
}
