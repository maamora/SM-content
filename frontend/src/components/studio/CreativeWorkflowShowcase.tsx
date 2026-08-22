/* STUDIO landing direction: restore the layered editorial canvas, but make one model photograph—not a post or brand card—the only visual artwork. */
"use client";

import { Check, ChevronRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import styles from "./CreativeWorkflowShowcase.module.css";

const MODEL_CAMPAIGN_IMAGE = "/studio/creative/campaign-stride.jpg";

const PROCESS_STEPS = [
    ["01", "Model image", "Visual reference"],
    ["02", "Creative direction", "Campaign intention"],
    ["03", "STUDIO", "Refine when ready"],
] as const;

export default function CreativeWorkflowShowcase() {
    const [direction, setDirection] = useState("A restrained campaign study: movement, material, and a clear product point of view.");
    const [staged, setStaged] = useState(false);

    return (
        <section className="creative-showcase studio-starfield" aria-labelledby="creative-showcase-heading">
            <svg className="creative-showcase__lines" viewBox="0 0 1200 560" preserveAspectRatio="none" aria-hidden="true">
                <path d="M126 392 C 350 390, 420 178, 616 154 S 906 180, 1104 254" />
                <path d="M616 154 C 694 180, 778 270, 1104 254" />
                <circle cx="126" cy="392" r="5" /><circle cx="616" cy="154" r="5" /><circle cx="1104" cy="254" r="5" />
            </svg>
            <div className="studio-shell creative-showcase__inner">
                <div className="creative-showcase__copy">
                    <p className="studio-kicker"><span className="studio-pulse" /> EDITORIAL CANVAS / 01</p>
                    <h2 id="creative-showcase-heading">Make every product<br /><em>yours.</em></h2>
                    <p>Start with a model-led visual direction. Shape the copy around it, then refine the work in STUDIO when you are ready.</p>
                    <div className="creative-showcase__actions">
                        <Link href="/register" className="studio-button studio-button--lime">Go to app <ChevronRight size={15} /></Link>
                        <span>Model → direction → STUDIO</span>
                    </div>
                    <div className={styles.processList} aria-label="Model-led creative process">
                        {PROCESS_STEPS.map(([index, label, note]) => <div key={index}><strong>{index}</strong><span>{label}</span><small>{note}</small></div>)}
                    </div>
                </div>

                <div className={`creative-showcase__canvas ${styles.layeredModelCanvas}`} aria-live="polite">
                    <div className="creative-showcase__canvas-topline">
                        <span>Creative canvas / 04</span>
                        <span>{staged ? "Direction staged" : "Viewing / model study"}</span>
                    </div>

                    <div className={styles.backFrame} aria-hidden="true"><span>Model / visual direction</span><i /></div>
                    <div className={styles.referenceSlip} aria-hidden="true">
                        <span>Visual signal / 01</span>
                        <strong>MODEL<br />STUDY</strong>
                        <small>movement<br />material<br />mood</small>
                    </div>
                    <figure className={styles.modelHero}>
                        <Image src={MODEL_CAMPAIGN_IMAGE} alt="Editorial model campaign image" width={1600} height={900} priority />
                        <figcaption><span>Model image / campaign reference</span><strong>Editorial focal</strong></figcaption>
                    </figure>
                    <div className={styles.directionPlate}>
                        <span>Direction / model-led</span>
                        <p>The image establishes the visual energy. Bring the product, message, and delivery plan into STUDIO afterwards.</p>
                        <i><Sparkles size={13} /> model image active</i>
                    </div>

                    <div className="creative-showcase__prompt-dock">
                        <div className="creative-showcase__prompt-label"><span>Creative direction</span><small>{staged ? "Direction saved for this study" : "Shape the campaign intent"}</small></div>
                        <textarea value={direction} onChange={(event) => { setDirection(event.target.value); setStaged(false); }} aria-label="Example creative direction" rows={2} />
                        <button type="button" onClick={() => setStaged(true)}><Check size={14} /> {staged ? "Staged" : "Stage direction"}</button>
                        <p>Example controls only — this landing study does not create or schedule a post.</p>
                    </div>
                    <div className="creative-showcase__canvas-footer"><span><span className="studio-dot studio-dot--lime" /> {staged ? "Direction staged" : "Model direction active"}</span><span>Creative controls / 01</span><span>One visual focal</span></div>
                </div>
            </div>
            <div className="studio-shell creative-showcase__footnote"><span>Model image</span><span>Creative direction</span><span>Editorial campaign study</span><span>Refine in STUDIO</span></div>
        </section>
    );
}
