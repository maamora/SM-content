"use client";

/* STUDIO landing direction: a dark editorial production canvas with portable image assets, sharp panels, acid-lime signals, and an honest still-set interaction rather than a simulated generation request. */
import { useState } from "react";
import { ArrowUpRight, Check, ImageIcon, Sparkles, WandSparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const DEMO_STEPS = [
    { id: "product", label: "Arc Runner", note: "product reference" },
    { id: "model", label: "Runner / 01", note: "model reference" },
    { id: "result", label: "After dark", note: "campaign still set" },
] as const;

const demoVideoUrl = process.env.NEXT_PUBLIC_STUDIO_DEMO_VIDEO_URL;
const productReferenceUrl = "/studio/creative/arc-runner-product.jpg";
const modelReferenceUrl = "/studio/creative/runner-model-reference.jpg";

const CAMPAIGN_STILLS = [
    {
        id: "motion",
        title: "Stride study",
        angle: "Side motion",
        prompt: "Fast stride through a warm olive studio. Preserve the runner, burgundy shoe, and soft kinetic blur.",
        src: "/studio/creative/campaign-stride.jpg",
    },
    {
        id: "detail",
        title: "Material study",
        angle: "Detail frame",
        prompt: "Tight editorial crop: quiet tailoring, burgundy shoe detail, and a soft directional shadow.",
        src: "/studio/creative/campaign-detail.jpg",
    },
    {
        id: "wide",
        title: "Open run",
        angle: "Wide frame",
        prompt: "Open studio run with a suspended stride, sage backdrop, and crisp space around the silhouette.",
        src: "/studio/creative/campaign-wide.jpg",
    },
] as const;

type StillId = (typeof CAMPAIGN_STILLS)[number]["id"];

export default function CreativeWorkflowShowcase() {
    const [active, setActive] = useState<(typeof DEMO_STEPS)[number]["id"]>("result");
    const [selectedStillId, setSelectedStillId] = useState<StillId>("wide");
    const [prompt, setPrompt] = useState<string>(CAMPAIGN_STILLS[2].prompt);
    const [briefStaged, setBriefStaged] = useState(false);

    const activeStep = DEMO_STEPS.find((step) => step.id === active) ?? DEMO_STEPS[2];
    const selectedStill = CAMPAIGN_STILLS.find((still) => still.id === selectedStillId) ?? CAMPAIGN_STILLS[2];

    function selectStill(still: (typeof CAMPAIGN_STILLS)[number]) {
        setSelectedStillId(still.id);
        setPrompt(still.prompt);
        setActive("result");
        setBriefStaged(false);
    }

    function stageDirection() {
        setActive("result");
        setBriefStaged(true);
    }

    return (
        <section className="creative-showcase studio-starfield" aria-labelledby="creative-showcase-heading">
            <svg className="creative-showcase__lines" viewBox="0 0 1200 560" preserveAspectRatio="none" aria-hidden="true">
                <path d="M126 392 C 350 390, 420 178, 616 154 S 906 180, 1104 254" />
                <path d="M616 154 C 694 180, 778 270, 1104 254" />
                <circle cx="126" cy="392" r="5" /><circle cx="616" cy="154" r="5" /><circle cx="1104" cy="254" r="5" />
            </svg>
            <div className="studio-shell creative-showcase__inner">
                <div className="creative-showcase__copy">
                    <p className="studio-kicker"><span className="studio-pulse" /> LIVE CREATIVE CANVAS / HIGGSFIELD</p>
                    <h2 id="creative-showcase-heading">Take your work<br /><em>further.</em></h2>
                    <p>Bring a product and a model together, choose the campaign direction, then compare usable visual frames before moving into STUDIO.</p>
                    <div className="creative-showcase__actions">
                        <Link href="/register" className="studio-button studio-button--lime">Go to app <ArrowUpRight size={15} /></Link>
                        <span><Sparkles size={14} /> Prompt → image → {demoVideoUrl ? "motion" : "variations"}</span>
                    </div>
                    <div className="creative-showcase__step-list" aria-label="Creative workflow steps">
                        {DEMO_STEPS.map((step, index) => (
                            <button key={step.id} type="button" className={active === step.id ? "is-active" : ""} onClick={() => setActive(step.id)} aria-pressed={active === step.id}>
                                <strong>0{index + 1}</strong><span>{step.label}</span><small>{step.note}</small>
                            </button>
                        ))}
                    </div>
                    <p className="creative-showcase__interaction-note"><WandSparkles size={13} /> Select a reference or a frame to explore this example.</p>
                </div>

                <div className="creative-showcase__canvas" aria-live="polite">
                    <div className="creative-showcase__canvas-topline">
                        <span>Creative canvas / 04</span>
                        <span>{briefStaged ? "Direction staged" : `Viewing / ${activeStep.label}`}</span>
                    </div>
                    <button type="button" className={`creative-showcase-node creative-showcase-node--product ${active === "product" ? "is-active" : ""}`} onClick={() => setActive("product")} aria-pressed={active === "product"}>
                        <span>Arc Runner / Product reference</span>
                        <Image className="creative-showcase-art creative-showcase-art--shoe" src={productReferenceUrl} alt="Burgundy Arc Runner shoe product reference" width={600} height={600} priority />
                        <b><ImageIcon size={11} /> Product image</b>
                    </button>

                    <button type="button" className={`creative-showcase-node creative-showcase-node--model ${active === "model" ? "is-active" : ""}`} onClick={() => setActive("model")} aria-pressed={active === "model"}>
                        <span>Runner / 01 · Model reference</span>
                        <Image className="creative-showcase-art creative-showcase-art--model" src={modelReferenceUrl} alt="Running fashion model reference in a sage studio" width={600} height={900} priority />
                        <b><ImageIcon size={11} /> Model image</b>
                    </button>

                    <div className={`creative-showcase-node creative-showcase-node--result ${active === "result" ? "is-active" : ""}`}>
                        <div className="creative-showcase-result__head"><span>After dark / {demoVideoUrl ? "motion preview" : "3-frame set"}</span><span className="creative-showcase-result__count">03</span></div>
                        {demoVideoUrl ? (
                            <video className="creative-showcase-art creative-showcase-art--result creative-showcase-video" src={demoVideoUrl} autoPlay muted loop playsInline controls aria-label="STUDIO generated campaign video" />
                        ) : (
                            <div className="creative-showcase-output" key={selectedStill.id}>
                                <Image src={selectedStill.src} alt={`${selectedStill.title} campaign example`} width={1600} height={900} />
                                <span>{selectedStill.angle}</span>
                            </div>
                        )}
                        {!demoVideoUrl && (
                            <div className="creative-showcase-variation-strip" aria-label="Campaign still variations">
                                {CAMPAIGN_STILLS.map((still, index) => (
                                    <button key={still.id} type="button" className={selectedStillId === still.id ? "is-selected" : ""} onClick={() => selectStill(still)} aria-label={`Show ${still.title}`} aria-pressed={selectedStillId === still.id}>
                                        <Image src={still.src} alt="" width={160} height={120} />
                                        <span>0{index + 1}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        <b>{demoVideoUrl ? "5 sec campaign video" : "Example stills · 03 variations"}</b>
                    </div>

                    <div className="creative-showcase__prompt-dock">
                        <div className="creative-showcase__prompt-label"><span>Scenario prompt</span><small>{briefStaged ? "Example direction staged" : "Edit the creative direction"}</small></div>
                        <textarea value={prompt} onChange={(event) => { setPrompt(event.target.value); setBriefStaged(false); }} aria-label="Example campaign scenario prompt" rows={2} />
                        <button type="button" onClick={stageDirection}><Check size={14} /> Stage direction</button>
                        <p>Demo controls only — no generation request is sent from this landing page.</p>
                    </div>
                    <div className="creative-showcase__canvas-footer"><span><span className="studio-dot studio-dot--lime" /> {briefStaged ? "Campaign direction staged" : "Campaign brief active"}</span><span>Prompt controls / 04</span><span>Output / {demoVideoUrl ? "motion" : "still set / 03"}</span></div>
                </div>
            </div>
            <div className="studio-shell creative-showcase__footnote"><span>Product reference</span><span>Model reference</span><span>Scenario prompt</span><span>{demoVideoUrl ? "One living output" : "Campaign stills / 03"}</span></div>
        </section>
    );
}
