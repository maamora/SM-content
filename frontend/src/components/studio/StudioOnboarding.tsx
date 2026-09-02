"use client";
/* SIGNAL WORKSTATION / GUIDANCE: contextual checklist for first-run workflow discovery. It relies on real product/post/brand state and stores only dismissal preference in local storage. */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, X } from "lucide-react";
import { getBrand, type BrandSettings } from "@/lib/api/brand";
import type { Product } from "@/lib/api/products";
import type { Post } from "@/lib/api/posts";

const dismissalKey = "studio-onboarding-dismissed";

export function StudioOnboarding({ products, posts }: { products: Product[]; posts: Post[] }) {
  const [brand, setBrand] = useState<BrandSettings | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(window.localStorage.getItem(dismissalKey) === "true");
    getBrand().then(setBrand).catch(() => setBrand(null));
  }, []);

  const steps = useMemo(() => [
    { label: "Brand kit", detail: "Logo · color · type", href: "/dashboard/brand", complete: Boolean(brand?.configured) },
    { label: "Add source", detail: "Product images", href: "/dashboard/products", complete: products.length > 0 },
    { label: "Create post", detail: "Local SVG", href: "/dashboard/studio", complete: posts.length > 0 },
  ], [brand?.configured, products.length, posts.length]);

  const completed = steps.filter((step) => step.complete).length;
  if (dismissed || completed === steps.length) return null;

  const dismiss = () => {
    window.localStorage.setItem(dismissalKey, "true");
    setDismissed(true);
  };

  return <section className="studio-onboarding" aria-label="First workspace steps">
    <header><div><span className="studio-kicker">SETUP</span><h2>Workspace setup</h2><p>{completed}/3 complete</p></div><button type="button" onClick={dismiss} aria-label="Dismiss first-run guidance"><X size={15} /></button></header>
    <ol>{steps.map((step, index) => <li className={step.complete ? "is-complete" : ""} key={step.label}><span>{step.complete ? <Check size={13} /> : `0${index + 1}`}</span><div><strong>{step.label}</strong><small>{step.detail}</small></div><Link href={step.href} aria-label={`Open ${step.label}`}><ChevronRight size={16} /></Link></li>)}</ol>
  </section>;
}
