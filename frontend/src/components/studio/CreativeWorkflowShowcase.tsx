/* STUDIO landing showcase: an interactive graphite canvas for the reference-to-motion narrative. */
"use client";

import { useState } from "react";
import { ArrowUpRight, Film, Sparkles } from "lucide-react";
import Link from "next/link";

const DEMO_STEPS = [
    { id: "product", label: "Star shoe", note: "product reference", color: "creative-showcase-node--product" },
    { id: "model", label: "Model running", note: "model reference", color: "creative-showcase-node--model" },
    { id: "result", label: "Sneaker showcase", note: "photo shoot / motion", color: "creative-showcase-node--result" },
] as const;

const demoVideoUrl = process.env.NEXT_PUBLIC_STUDIO_DEMO_VIDEO_URL;

export default function CreativeWorkflowShowcase() {
    const [active, setActive] = useState("result");
    const activeStep = DEMO_STEPS.find((step) => step.id === active) ?? DEMO_STEPS[2];

    return (
        <section className="creative-showcase studio-starfield">
            <svg className="creative-showcase__lines" viewBox="0 0 1200 560" preserveAspectRatio="none" aria-hidden="true"><path d="M120 370 C 360 370, 410 180, 620 150 S 900 170, 1110 250" /><path d="M620 150 C 710 180, 760 270, 1110 250" /><circle cx="120" cy="370" r="5" /><circle cx="620" cy="150" r="5" /><circle cx="1110" cy="250" r="5" /></svg>
            <div className="studio-shell creative-showcase__inner">
                <div className="creative-showcase__copy">
                    <p className="studio-kicker"><span className="studio-pulse" /> LIVE CREATIVE CANVAS / HIGGSFIELD</p>
                    <h2>Take your work<br /><em>further.</em></h2>
                    <p>Bring two references together, describe the shoot, and watch one product become a moving campaign frame.</p>
                    <div className="creative-showcase__actions"><Link href="/register" className="studio-button studio-button--lime">Go to app <ArrowUpRight size={15} /></Link><span><Sparkles size={14} /> Prompt → image → motion</span></div>
                    <div className="creative-showcase__step-list">
                        {DEMO_STEPS.map((step, index) => <button key={step.id} type="button" className={active === step.id ? "is-active" : ""} onClick={() => setActive(step.id)}><strong>0{index + 1}</strong><span>{step.label}</span><small>{step.note}</small></button>)}
                    </div>
                </div>
                <div className="creative-showcase__canvas" aria-live="polite">
                    <div className={`creative-showcase-node creative-showcase-node--product ${active === "product" ? "is-active" : ""}`} onClick={() => setActive("product")}><span>Star shoe / Nano Pro</span><div className="creative-showcase-art creative-showcase-art--shoe" /><b>product image</b></div>
                    <div className={`creative-showcase-node creative-showcase-node--model ${active === "model" ? "is-active" : ""}`} onClick={() => setActive("model")}><span>Model running / Nano</span><div className="creative-showcase-art creative-showcase-art--model" /><b>model image</b></div>
                    <div className={`creative-showcase-node creative-showcase-node--result ${active === "result" ? "is-active" : ""}`} onClick={() => setActive("result")}><span>{activeStep.label} / Veo-ready</span>{active === "result" && demoVideoUrl ? <video className="creative-showcase-art creative-showcase-art--result creative-showcase-video" src={demoVideoUrl} autoPlay muted loop playsInline controls aria-label="STUDIO generated campaign video" /> : <div className="creative-showcase-art creative-showcase-art--result"><Film size={32} /></div>}<b>{active === "result" && demoVideoUrl ? "5 sec result video" : "video provider not configured"}</b></div>
                    <div className="creative-showcase__canvas-footer"><span><span className="studio-dot studio-dot--lime" /> Model running</span><span>Prompt controls / 04</span><span>Output / {active === "result" && demoVideoUrl ? "video" : "provider-ready"}</span></div>
                </div>
            </div>
            <div className="studio-shell creative-showcase__footnote"><span>Product reference</span><span>Model reference</span><span>Scenario prompt</span><span>One living output</span></div>
        </section>
    );
}
