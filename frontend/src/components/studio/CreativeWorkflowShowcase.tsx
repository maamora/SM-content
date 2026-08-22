"use client";

/* STUDIO landing direction: a dark editorial production canvas with one intentional campaign frame, sharp panels, acid-lime signals, and no competing imagery. */
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import styles from "./CreativeWorkflowShowcase.module.css";

const MODEL_CAMPAIGN_IMAGE = "/studio/creative/campaign-stride.jpg";

export default function CreativeWorkflowShowcase() {
    return (
        <section className="creative-showcase studio-starfield" aria-labelledby="creative-showcase-heading">
            <svg className="creative-showcase__lines" viewBox="0 0 1200 560" preserveAspectRatio="none" aria-hidden="true">
                <path d="M126 392 C 350 390, 420 178, 616 154 S 906 180, 1104 254" />
                <path d="M616 154 C 694 180, 778 270, 1104 254" />
                <circle cx="126" cy="392" r="5" /><circle cx="616" cy="154" r="5" /><circle cx="1104" cy="254" r="5" />
            </svg>
            <div className="studio-shell creative-showcase__inner">
                <div className="creative-showcase__copy">
                    <p className="studio-kicker"><span className="studio-pulse" /> EDITORIAL FRAME / 01</p>
                    <h2 id="creative-showcase-heading">Make every product<br /><em>yours.</em></h2>
                    <p>Start with one decisive campaign frame. Refine the copy, approve the post, then move it into your publishing calendar.</p>
                    <div className="creative-showcase__actions">
                        <Link href="/register" className="studio-button studio-button--lime">Go to app <ArrowUpRight size={15} /></Link>
                        <span>One frame · one clear direction</span>
                    </div>
                    <div className={styles.singleNote}><strong>01</strong><span>Model campaign frame</span><small>Focused visual direction</small></div>
                </div>

                <div className={`creative-showcase__canvas ${styles.modelOnly}`}>
                    <div className="creative-showcase__canvas-topline">
                        <span>Creative canvas / 04</span>
                        <span>Viewing / model frame</span>
                    </div>
                    <figure className={styles.modelFrame}>
                        <Image src={MODEL_CAMPAIGN_IMAGE} alt="Editorial model campaign frame" width={1600} height={900} priority />
                        <figcaption><span>Campaign frame / 01</span><strong>Product-forward</strong></figcaption>
                    </figure>
                    <div className={styles.modelNote}>
                        <span>Focused post direction</span>
                        <p>One model image. A clear visual point of view.</p>
                    </div>
                    <div className="creative-showcase__canvas-footer"><span><span className="studio-dot studio-dot--lime" /> Campaign focal active</span><span>Frame / 01</span><span>Editorial still</span></div>
                </div>
            </div>
            <div className="studio-shell creative-showcase__footnote"><span>Focused visual direction</span><span>Model campaign frame</span><span>Editable in STUDIO</span></div>
        </section>
    );
}
