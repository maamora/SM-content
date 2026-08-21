"use client";

/* STUDIO landing direction: a dark editorial production canvas with a product-first, editable template workflow, sharp panels, acid-lime signals, and honest local-composition controls. */
import { useState } from "react";
import { ArrowUpRight, Check, ImageIcon, Sparkles, WandSparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const DEMO_STEPS = [
    { id: "product", label: "Arc Runner", note: "product reference" },
    { id: "template", label: "Grid / 02", note: "template + brand mark" },
    { id: "result", label: "Post set", note: "editable layout studies" },
] as const;

const productReferenceUrl = "/studio/creative/arc-runner-product.jpg";

const CAMPAIGN_STILLS = [
    {
        id: "motion",
        title: "Campaign card",
        angle: "Product-forward",
        prompt: "Lead with the product. Keep the campaign title restrained, the offer clear, and the composition open.",
        src: "/studio/creative/campaign-stride.jpg",
    },
    {
        id: "detail",
        title: "Detail card",
        angle: "Material focus",
        prompt: "Use a tight material crop, a calm directional shadow, and just enough space for the badge.",
        src: "/studio/creative/campaign-detail.jpg",
    },
    {
        id: "wide",
        title: "Editorial card",
        angle: "Open layout",
        prompt: "Give the product generous space, a soft sage field, and a clear hierarchy for the offer.",
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
                    <p className="studio-kicker"><span className="studio-pulse" /> LIVE POST CANVAS / LOCAL</p>
                    <h2 id="creative-showcase-heading">Make every product<br /><em>yours.</em></h2>
                    <p>Start with a product, select a template, bring in your brand mark, then refine a post before it enters your publishing calendar.</p>
                    <div className="creative-showcase__actions">
                        <Link href="/register" className="studio-button studio-button--lime">Go to app <ArrowUpRight size={15} /></Link>
                        <span><Sparkles size={14} /> Product → template → post</span>
                    </div>
                    <div className="creative-showcase__step-list" aria-label="Creative workflow steps">
                        {DEMO_STEPS.map((step, index) => (
                            <button key={step.id} type="button" className={active === step.id ? "is-active" : ""} onClick={() => setActive(step.id)} aria-pressed={active === step.id}>
                                <strong>0{index + 1}</strong><span>{step.label}</span><small>{step.note}</small>
                            </button>
                        ))}
                    </div>
                    <p className="creative-showcase__interaction-note"><WandSparkles size={13} /> Select a product, template, or post frame to explore this example.</p>
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

                    <button type="button" className={`creative-showcase-node creative-showcase-node--model ${active === "template" ? "is-active" : ""}`} onClick={() => setActive("template")} aria-pressed={active === "template"}>
                        <span>Grid / 02 · Template + brand mark</span>
                        <div className="creative-showcase-template-card" aria-hidden="true"><i>STUDIO</i><strong>ARC / RUNNER</strong><em>LIMITED DROP</em></div>
                        <b><Sparkles size={11} /> Editable system</b>
                    </button>

                    <div className={`creative-showcase-node creative-showcase-node--result ${active === "result" ? "is-active" : ""}`}>
                        <div className="creative-showcase-result__head"><span>Post set / 3 layout studies</span><span className="creative-showcase-result__count">03</span></div>
                        <div className="creative-showcase-output" key={selectedStill.id}>
                            <Image src={selectedStill.src} alt={`${selectedStill.title} post-layout example`} width={1600} height={900} />
                            <span>{selectedStill.angle}</span>
                        </div>
                        <div className="creative-showcase-variation-strip" aria-label="Post layout variations">
                            {CAMPAIGN_STILLS.map((still, index) => (
                                <button key={still.id} type="button" className={selectedStillId === still.id ? "is-selected" : ""} onClick={() => selectStill(still)} aria-label={`Show ${still.title}`} aria-pressed={selectedStillId === still.id}>
                                    <Image src={still.src} alt="" width={160} height={120} />
                                    <span>0{index + 1}</span>
                                </button>
                            ))}
                        </div>
                        <b>Example post layouts · 03 variations</b>
                    </div>

                    <div className="creative-showcase__prompt-dock">
                        <div className="creative-showcase__prompt-label"><span>Post direction</span><small>{briefStaged ? "Example post staged" : "Edit the post controls"}</small></div>
                        <textarea value={prompt} onChange={(event) => { setPrompt(event.target.value); setBriefStaged(false); }} aria-label="Example post direction" rows={2} />
                        <button type="button" onClick={stageDirection}><Check size={14} /> Stage post</button>
                        <p>Demo controls only — no post is rendered or scheduled from this landing page.</p>
                    </div>
                    <div className="creative-showcase__canvas-footer"><span><span className="studio-dot studio-dot--lime" /> {briefStaged ? "Post direction staged" : "Post brief active"}</span><span>Post controls / 04</span><span>Output / layout set / 03</span></div>
                </div>
            </div>
            <div className="studio-shell creative-showcase__footnote"><span>Product reference</span><span>Template + brand mark</span><span>Post direction</span><span>Editable layouts / 03</span></div>
        </section>
    );
}
