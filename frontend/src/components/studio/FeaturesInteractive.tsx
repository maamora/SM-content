/* STUDIO feature rule: turn the dark editorial system into a scroll-led control room—quiet chrome, strong type, signal-lime state changes, and motion that explains the product. */
"use client";

import Link from "next/link";
import { ArrowDown, ArrowUpRight, Check, Image as ImageIcon, Languages, Play, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StudioFooter, StudioHeader } from "./StudioShell";

type Chapter = {
  id: string;
  index: string;
  label: string;
  title: string;
  body: string;
  stat: string;
};

const chapters: Chapter[] = [
  { id: "brief", index: "01", label: "Brief to direction", title: "Keep the why attached to the work.", body: "Drop the rough idea into a living brief, then give every visual, caption, and variation the same point of view.", stat: "one brief / many moves" },
  { id: "visuals", index: "02", label: "Visual families", title: "Make more without making noise.", body: "Generate a considered set of directions, compare the family, and pull the strongest frame forward for refinement.", stat: "12 directions / 01 signal" },
  { id: "language", index: "03", label: "Language in motion", title: "Let every market sound like the same brand.", body: "Translate and adapt captions in context, with tone and campaign intent visible beside the visual it belongs to.", stat: "EN / FR / AR ready" },
  { id: "ship", index: "04", label: "Approval to publish", title: "Move the final draft forward.", body: "Keep review, status, and publishing decisions in the same thread so the handoff doesn&apos;t become a second project.", stat: "review / approve / ship" },
];

const visualModes = [
  { label: "Editorial", color: "#b9ff43", description: "Soft daylight, tactile shadow, a little more air." },
  { label: "Night study", color: "#9aa8ff", description: "Low-key contrast with the product held in focus." },
  { label: "Material", color: "#edb894", description: "Close texture, warm surface, campaign-ready detail." },
];

function useActiveChapter() {
  const [active, setActive] = useState(chapters[0].id);
  useEffect(() => {
    const nodes = chapters.map(({ id }) => document.getElementById(`feature-${id}`)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id.replace("feature-", ""));
    }, { rootMargin: "-32% 0px -48%", threshold: [0.1, 0.35, 0.7] });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
  return active;
}

export default function FeaturesInteractive() {
  const active = useActiveChapter();
  const [mode, setMode] = useState(0);
  const [playing, setPlaying] = useState(false);
  const currentMode = useMemo(() => visualModes[mode], [mode]);

  return (
    <main className="studio-site studio-features-page">
      <StudioHeader />
      <section className="studio-features-hero studio-starfield">
        <div className="studio-shell studio-features-hero__grid">
          <div className="studio-features-hero__copy">
            <p className="studio-kicker">THE SYSTEM / 04 MOVES</p>
            <h1>Features that make the next move <em>obvious.</em></h1>
            <p>STUDIO turns the space between brief and publish into a visible, responsive creative system.</p>
            <div className="studio-features-hero__actions">
              <Link href="/register" className="studio-button studio-button--lime studio-button--large">Open the canvas <ArrowUpRight size={16} /></Link>
              <a href="#feature-brief" className="studio-button studio-button--outline studio-button--large">Trace the system <ArrowDown size={16} /></a>
            </div>
          </div>
          <div className="studio-features-hero__signal" aria-label="Interactive STUDIO system overview">
            <div className="studio-features-hero__signal-top"><span><i /> LIVE SYSTEM</span><span>SCROLL / 01—04</span></div>
            <div className="studio-features-hero__signal-stage">
              <div className="studio-signal-card studio-signal-card--brief"><span>BRIEF / 001</span><strong>Spring<br />campaign</strong><small>Visual direction</small></div>
              <div className="studio-signal-line studio-signal-line--one" />
              <div className="studio-signal-card studio-signal-card--visual"><Sparkles size={16} /><span>GENERATIVE CANVAS</span><strong>12 directions</strong><b><i /> READY TO REFINE</b></div>
              <div className="studio-signal-line studio-signal-line--two" />
              <div className="studio-signal-card studio-signal-card--ship"><span>STATUS / 004</span><strong>Approved<br /><em>to move.</em></strong><small>Publishing thread</small></div>
              <div className="studio-signal-orbit" />
            </div>
            <div className="studio-features-hero__signal-bottom"><span>STUDIO / 2026</span><span>↓ SCROLL TO ACTIVATE</span></div>
          </div>
        </div>
      </section>

      <section className="studio-features-story" aria-label="STUDIO feature walkthrough">
        <div className="studio-shell studio-features-story__layout">
          <aside className="studio-features-index">
            <p className="studio-kicker">THE WALKTHROUGH</p>
            <div className="studio-features-index__rail">{chapters.map((chapter) => <a key={chapter.id} href={`#feature-${chapter.id}`} className={active === chapter.id ? "is-active" : ""}><span>{chapter.index}</span><b>{chapter.label}</b></a>)}</div>
            <p className="studio-features-index__note">Scroll through the system. The canvas changes with the decision.</p>
          </aside>
          <div className="studio-features-story__chapters">
            {chapters.map((chapter) => <article id={`feature-${chapter.id}`} className={`studio-feature-chapter ${active === chapter.id ? "is-active" : ""}`} key={chapter.id}>
              <div className="studio-feature-chapter__copy"><span className="studio-feature-chapter__index">{chapter.index} / {chapter.label}</span><h2>{chapter.title}</h2><p>{chapter.body}</p><span className="studio-feature-chapter__stat">{chapter.stat}</span></div>
              <div className="studio-feature-chapter__canvas">
                {chapter.id === "brief" && <div className="studio-brief-canvas"><span className="studio-canvas-label">CREATIVE BRIEF / SPRING 26</span><h3>Make the quiet<br /><em>feel magnetic.</em></h3><div className="studio-brief-canvas__meta"><span>Audience <b>Modern ritualists</b></span><span>Signal <b>Soft tension</b></span><span>Output <b>Image / motion / copy</b></span></div><div className="studio-brief-canvas__cursor"><i /> mood is a material</div></div>}
                {chapter.id === "visuals" && <div className="studio-visual-canvas"><div className="studio-visual-canvas__toolbar"><span><ImageIcon size={13} /> VISUAL FAMILY</span><b>{currentMode.label}</b></div><div className={`studio-visual-canvas__image studio-visual-canvas__image--${mode}`}><div className="studio-visual-canvas__orb" /><span>{currentMode.description}</span></div><div className="studio-visual-canvas__modes">{visualModes.map((item, index) => <button key={item.label} className={mode === index ? "is-selected" : ""} onClick={() => setMode(index)}><i style={{ background: item.color }} />{item.label}<small>{String(index + 1).padStart(2, "0")}</small></button>)}</div></div>}
                {chapter.id === "language" && <div className="studio-language-canvas"><div className="studio-language-canvas__header"><Languages size={14} /> CAMPAIGN CAPTION / CONTEXT PRESERVED</div><div className="studio-language-canvas__main"><span>ENGLISH / SOURCE</span><h3>Make room for<br /><em>the next feeling.</em></h3><div className="studio-language-canvas__line" /><span>FRANÇAIS / ADAPTED</span><p>Créer de l&apos;espace<br /><em>pour le prochain frisson.</em></p><div className="studio-language-canvas__locale">EN <b>→</b> FR <b>→</b> AR</div></div></div>}
                {chapter.id === "ship" && <div className="studio-ship-canvas"><div className="studio-ship-canvas__top"><span>CAMPAIGN / SPRING 26</span><button onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause preview" : "Play preview"}>{playing ? <span className="studio-pause-icon" /> : <Play size={14} fill="currentColor" />}</button></div><div className={`studio-ship-canvas__preview ${playing ? "is-playing" : ""}`}><div className="studio-ship-canvas__frame"><span>FINAL FRAME / 06</span><strong>READY<br /><em>TO MOVE.</em></strong></div><div className="studio-ship-canvas__pulse" /></div><div className="studio-ship-canvas__footer"><span><Check size={13} /> APPROVED BY CREATIVE</span><b>08:42 / READY TO SHIP</b></div></div>}
              </div>
            </article>)}
          </div>
        </div>
      </section>

      <section className="studio-features-cta studio-light-section"><div className="studio-shell studio-features-cta__inner"><div><p className="studio-kicker studio-kicker--dark">THE NEXT DRAFT</p><h2>Make the system<br /><em>move with you.</em></h2></div><Link href="/register" className="studio-button studio-button--dark studio-button--large">Open STUDIO <ArrowUpRight size={16} /></Link></div></section>
      <StudioFooter />
    </main>
  );
}
