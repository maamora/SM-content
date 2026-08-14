// STUDIO refined creative desk: composed, cinematic, and editorial rather than graph-like.

"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, Check, Command, SlidersHorizontal, Sparkles } from "lucide-react";
import { studioImages } from "./StudioShell";

type CreativeWorkbenchProps = {
  compact?: boolean;
  ctaHref?: string;
  ctaLabel?: string;
};

export function CreativeWorkbench({ compact = false, ctaHref = "/register", ctaLabel = "Open the desk" }: CreativeWorkbenchProps) {
  return (
    <section className={`studio-workbench ${compact ? "studio-workbench--compact" : ""}`} aria-label="STUDIO creative workbench">
      <div className="studio-workbench__toolbar">
        <div className="studio-workbench__thread"><span className="studio-dot studio-dot--lime" /><span>Thread / Summer 26</span><span className="studio-workbench__saved">Saved 18 sec ago</span></div>
        <div className="studio-workbench__toolbar-actions"><span><Command size={13} /> K</span><span className="studio-workbench__toolbar-button">Share</span><Link href={ctaHref} className="studio-workbench__toolbar-button studio-workbench__toolbar-button--lime">Export <ArrowUpRight size={13} /></Link></div>
      </div>
      <div className="studio-workbench__body">
        <aside className="studio-workbench__brief">
          <span className="studio-kicker">01 / BRIEF</span>
          <h3>Soft light.<br /><em>Hard point of view.</em></h3>
          <p>A considered visual family for a summer launch, built from one clear feeling.</p>
          <div className="studio-workbench__prompt"><span className="studio-workbench__prompt-icon"><Sparkles size={14} /></span><span><small>Prompt</small><strong>Quiet confidence, warm mineral tones, editorial crop.</strong></span></div>
          <div className="studio-workbench__brief-meta"><span><b>Voice</b> Quietly exact</span><span><b>Market</b> Global / 04</span></div>
        </aside>
        <div className="studio-workbench__stage">
          <div className="studio-workbench__stage-grid" aria-hidden="true" />
          <motion.div className="studio-workbench__hero-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }}>
            <Image src={studioImages.hero} alt="Editorial visual direction" fill sizes="(max-width: 760px) 78vw, 38vw" className="studio-media" />
            <div className="studio-workbench__image-caption"><span>Direction 04 / image</span><span>4:5</span></div>
          </motion.div>
          <motion.div className="studio-workbench__reference-card" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .65, delay: .12 }}>
            <Image src={studioImages.model} alt="Editorial model reference" fill sizes="180px" className="studio-media" />
            <span>Reference / 02</span>
          </motion.div>
          <div className="studio-workbench__palette"><span /><span /><span /><b>Palette / 03</b></div>
          <div className="studio-workbench__stage-note"><Check size={12} /> Direction feels aligned</div>
        </div>
        <aside className="studio-workbench__inspector">
          <span className="studio-kicker">03 / FINISH</span>
          <h4>Make it ready.</h4>
          <div className="studio-workbench__control"><span>Format</span><strong>Portrait / 4:5</strong></div>
          <div className="studio-workbench__control"><span>Caption system</span><strong>English + Français + العربية</strong></div>
          <div className="studio-workbench__control"><span>Variants</span><strong>04 outputs <small>ready</small></strong></div>
          <Link href={ctaHref} className="studio-button studio-button--lime studio-button--small"><SlidersHorizontal size={14} /> {ctaLabel}</Link>
        </aside>
      </div>
      <div className="studio-workbench__footer"><span>01 Brief</span><span className="is-active">02 Direction</span><span>03 Language</span><span>04 Publish</span><span className="studio-workbench__footer-status"><span className="studio-dot studio-dot--lime" /> Live creative thread</span></div>
    </section>
  );
}
