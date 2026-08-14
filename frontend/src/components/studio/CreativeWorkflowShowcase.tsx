/* STUDIO landing showcase: an interactive graphite canvas for the reference-to-motion narrative. */
"use client";

/* STUDIO landing direction: a dark editorial production canvas with real campaign references, sharp panels, acid-lime signals, and an honest still-set fallback for unavailable motion. */
import { useState } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const DEMO_STEPS = [
    { id: "product", label: "Arc Runner", note: "product reference" },
    { id: "model", label: "Runner / 01", note: "model reference" },
    { id: "result", label: "After dark", note: "campaign still set" },
] as const;

const demoVideoUrl = process.env.NEXT_PUBLIC_STUDIO_DEMO_VIDEO_URL;
const productReferenceUrl = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663858603810/uHLrzsHWOMTIIpIM.png";
const modelReferenceUrl = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663858603810/umAoaFykzQESyaut.png";

const CAMPAIGN_STILLS = [
    { id: "motion", title: "Stride study", angle: "Side motion", src: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663858603810/eAyMUCQdDXGloBNm.png" },
    { id: "detail", title: "Material study", angle: "Detail frame", src: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663858603810/kCmbriTqKMziOWdx.png" },
    { id: "wide", title: "Open run", angle: "Wide frame", src: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663858603810/PyjNuGByfqwmvPQo.png" },
] as const;

export default function CreativeWorkflowShowcase() {
    const [active, setActive] = useState("result");
    const [selectedStillId, setSelectedStillId] = useState<(typeof CAMPAIGN_STILLS)[number]["id"]>("wide");
    const activeStep = DEMO_STEPS.find((step) => step.id === active) ?? DEMO_STEPS[2];
    const selectedStill = CAMPAIGN_STILLS.find((still) => still.id === selectedStillId) ?? CAMPAIGN_STILLS[2];

    return (
        <section className="creative-showcase studio-starfield">
            <svg className="creative-showcase__lines" viewBox="0 0 1200 560" preserveAspectRatio="none" aria-hidden="true"><path d="M120 370 C 360 370, 410 180, 620 150 S 900 170, 1110 250" /><path d="M620 150 C 710 180, 760 270, 1110 250" /><circle cx="120" cy="370" r="5" /><circle cx="620" cy="150" r="5" /><circle cx="1110" cy="250" r="5" /></svg>
            <div className="studio-shell creative-showcase__inner">
                <div className="creative-showcase__copy">
                    <p className="studio-kicker"><span className="studio-pulse" /> LIVE CREATIVE CANVAS / HIGGSFIELD</p>
                    <h2>Take your work<br /><em>further.</em></h2>
                    <p>Bring a product and a model together, set the scene, then shape a campaign from multiple usable frames.</p>
                    <div className="creative-showcase__actions"><Link href="/register" className="studio-button studio-button--lime">Go to app <ArrowUpRight size={15} /></Link><span><Sparkles size={14} /> Prompt → image → {demoVideoUrl ? "motion" : "variations"}</span></div>
                    <div className="creative-showcase__step-list">
                        {DEMO_STEPS.map((step, index) => <button key={step.id} type="button" className={active === step.id ? "is-active" : ""} onClick={() => setActive(step.id)}><strong>0{index + 1}</strong><span>{step.label}</span><small>{step.note}</small></button>)}
                    </div>
                </div>
                <div className="creative-showcase__canvas" aria-live="polite">
                    <button type="button" className={`creative-showcase-node creative-showcase-node--product ${active === "product" ? "is-active" : ""}`} onClick={() => setActive("product")} aria-pressed={active === "product"}>
                        <span>Arc Runner / Product reference</span>
                        <Image className="creative-showcase-art creative-showcase-art--shoe" src={productReferenceUrl} alt="Burgundy Arc Runner shoe product reference" width={600} height={600} />
                        <b>Product image</b>
                    </button>
                    <button type="button" className={`creative-showcase-node creative-showcase-node--model ${active === "model" ? "is-active" : ""}`} onClick={() => setActive("model")} aria-pressed={active === "model"}>
                        <span>Runner / 01 · Model reference</span>
                        <Image className="creative-showcase-art creative-showcase-art--model" src={modelReferenceUrl} alt="Running fashion model reference in a sage studio" width={600} height={900} />
                        <b>Model image</b>
                    </button>
                    <div className={`creative-showcase-node creative-showcase-node--result ${active === "result" ? "is-active" : ""}`}>
                        <span>{activeStep.label} / {demoVideoUrl ? "motion ready" : "3-frame set"}</span>
                        {demoVideoUrl ? (
                            <video className="creative-showcase-art creative-showcase-art--result creative-showcase-video" src={demoVideoUrl} autoPlay muted loop playsInline controls aria-label="STUDIO generated campaign video" />
                        ) : (
                            <div className="creative-showcase-output">
                                <Image src={selectedStill.src} alt={`${selectedStill.title} campaign example`} width={1600} height={900} />
                                <span>{selectedStill.angle}</span>
                            </div>
                        )}
                        {!demoVideoUrl && <div className="creative-showcase-variation-strip" aria-label="Campaign still variations">{CAMPAIGN_STILLS.map((still) => <button key={still.id} type="button" className={selectedStillId === still.id ? "is-selected" : ""} onClick={() => { setSelectedStillId(still.id); setActive("result"); }} aria-label={`Show ${still.title}`}><Image src={still.src} alt="" width={160} height={120} /></button>)}</div>}
                        <b>{demoVideoUrl ? "5 sec campaign video" : "Example stills · 03 variations"}</b>
                    </div>
                    <div className="creative-showcase__canvas-footer"><span><span className="studio-dot studio-dot--lime" /> Campaign brief active</span><span>Prompt controls / 04</span><span>Output / {demoVideoUrl ? "motion" : "still set / 03"}</span></div>
                </div>
            </div>
            <div className="studio-shell creative-showcase__footnote"><span>Product reference</span><span>Model reference</span><span>Scenario prompt</span><span>{demoVideoUrl ? "One living output" : "Campaign stills / 03"}</span></div>
        </section>
    );
}
