"use client";
/* CONNECT TUTORIAL: a friendly, hand-drawn-style walkthrough for linking a social channel.
   Lives above the channel list on the Social/Delivery page. Dismissible per visit — this is
   a "first time here" nudge, not something that should permanently eat vertical space. */

import { useState } from "react";
import { X } from "lucide-react";

function StepBadgeDoodle() {
    return (
        <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="28" width="26" height="26" rx="7" transform="rotate(-6 23 41)" fill="#1c1f16" stroke="#4c5140" strokeWidth="2" />
            <circle cx="23" cy="41" r="5" fill="#787c72" />
            <rect x="47" y="20" width="26" height="26" rx="7" transform="rotate(4 60 33)" fill="#1c1f16" stroke="#4c5140" strokeWidth="2" />
            <path d="M53 33 l5 5 9-10" transform="rotate(4 60 33)" stroke="#787c72" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <rect x="84" y="30" width="26" height="26" rx="7" transform="rotate(-3 97 43)" fill="#1c1f16" stroke="#4c5140" strokeWidth="2" />
            <path d="M91 43 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0" transform="rotate(-3 97 43)" stroke="#787c72" strokeWidth="2.2" fill="none" />
            {/* Highlighted pick + pointing hand */}
            <rect x="47" y="20" width="26" height="26" rx="7" transform="rotate(4 60 33)" fill="none" stroke="#c6ff5e" strokeWidth="2.6" strokeDasharray="3 4" />
            <path d="M64 66 C 70 60, 78 58, 84 62 C 88 64, 88 70, 84 72 L 70 78" stroke="#e9ebe0" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            <path d="M64 66 l-4 10" stroke="#e9ebe0" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M60 40 l6 3 M63 34 l6 1" stroke="#c6ff5e" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function StepConnectDoodle() {
    return (
        <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="24" y="38" width="72" height="30" rx="15" fill="#1c1f16" stroke="#c6ff5e" strokeWidth="2.4" />
            <path d="M46 53 l8 8 18 -18" stroke="#c6ff5e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            {/* cursor */}
            <path d="M80 74 L94 88 L88 90 L92 98 L86 100 L82 92 L78 98 Z" fill="#e9ebe0" transform="translate(-4 -8) scale(0.9)" />
            {/* sparkles */}
            <path d="M20 20 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z" fill="#c6ff5e" opacity="0.9" />
            <path d="M100 16 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" fill="#c6ff5e" opacity="0.7" />
            <circle cx="14" cy="70" r="2.4" fill="#787c72" />
            <circle cx="106" cy="60" r="2" fill="#787c72" />
        </svg>
    );
}

function StepLinkedDoodle() {
    return (
        <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="14" y="34" width="34" height="34" rx="10" transform="rotate(-8 31 51)" fill="#1c1f16" stroke="#c6ff5e" strokeWidth="2.4" />
            <rect x="72" y="34" width="34" height="34" rx="10" transform="rotate(8 89 51)" fill="#1c1f16" stroke="#c6ff5e" strokeWidth="2.4" />
            <path d="M46 50 C 54 44, 66 44, 74 50" stroke="#c6ff5e" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="60" cy="47" r="9" fill="#c6ff5e" />
            <path d="M55 47 l3.5 3.5 7 -7" stroke="#11110f" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            {/* confetti */}
            <circle cx="18" cy="18" r="2.2" fill="#e9ebe0" />
            <circle cx="104" cy="20" r="2" fill="#e9ebe0" />
            <path d="M96 78 l3 6 M12 80 l-3 6" stroke="#787c72" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

const steps = [
    { Doodle: StepBadgeDoodle, title: "Pick a channel", detail: "Meta, TikTok, LinkedIn or X — choose which one you want your posts to go to." },
    { Doodle: StepConnectDoodle, title: "Tap Connect", detail: "You'll land on that platform's own sign-in screen — STUDIO never sees your password." },
    { Doodle: StepLinkedDoodle, title: "You're linked!", detail: "The channel lights up green below. From here, Batch and Social can publish to it." },
];

export default function ConnectTutorial() {
    const [dismissed, setDismissed] = useState(false);
    if (dismissed) return null;
    return (
        <section className="studio-workspace-panel studio-workspace-panel--accent" style={{ position: "relative" }}>
            <button
                type="button"
                aria-label="Dismiss tutorial"
                onClick={() => setDismissed(true)}
                style={{ position: "absolute", top: 14, right: 14, color: "#9c9f94", background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
            >
                <X size={16} />
            </button>
            <span className="studio-kicker studio-kicker--dark">FIRST TIME HERE?</span>
            <h2 style={{ marginTop: 4 }}>Linking a channel takes three taps.</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 18, marginTop: 18 }}>
                {steps.map(({ Doodle, title, detail }, index) => (
                    <div key={title} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 8 }}>
                        <div style={{ width: 96, height: 80 }}><Doodle /></div>
                        <strong style={{ fontSize: 12, color: "#e9ebe0" }}>{index + 1}. {title}</strong>
                        <span style={{ fontSize: 11, color: "#9c9f94", lineHeight: 1.5, maxWidth: 200 }}>{detail}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}
