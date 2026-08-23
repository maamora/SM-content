"use client";
/* SIGNAL WORKSTATION / POWER USER: keyboard-first route launcher. Every command navigates to an existing authenticated workflow; no action is simulated. */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Command, CornerDownLeft, Search, X } from "lucide-react";

const commands = [
  { label: "Start a new post", detail: "Open the local-SVG artboard", href: "/dashboard/studio", group: "Create" },
  { label: "Add product source", detail: "Open the source library and upload form", href: "/dashboard/products", group: "Create" },
  { label: "Open Brand kit", detail: "Set logo, color, typography, and tone", href: "/dashboard/brand", group: "Create" },
  { label: "Run a batch", detail: "Create a family of local compositions", href: "/dashboard/batch", group: "Create" },
  { label: "Review posts", detail: "Inspect saved posts and export files", href: "/dashboard/posts", group: "Library" },
  { label: "Browse source assets", detail: "Open product and post media", href: "/dashboard/assets", group: "Library" },
  { label: "Open delivery desk", detail: "Connect channels and schedule an approved post", href: "/dashboard/social", group: "Delivery" },
  { label: "Read workspace signals", detail: "Open approval and email activity", href: "/dashboard/notifications", group: "Delivery" },
  { label: "Open workspace settings", detail: "Inspect real capabilities and account context", href: "/dashboard/settings", group: "Delivery" },
] as const;

export function StudioCommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? commands.filter((item) => `${item.label} ${item.detail} ${item.group}`.toLowerCase().includes(needle)) : commands;
  }, [query]);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  return <>
    <button type="button" className="studio-command-trigger" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label="Open command palette">
      <Command size={15} /><span>Command</span><kbd>⌘ K</kbd>
    </button>
    {open && <div className="studio-command-overlay" role="presentation" onMouseDown={() => setOpen(false)}>
      <section className="studio-command-palette" role="dialog" aria-modal="true" aria-label="STUDIO command palette" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><Command size={16} /><span>STUDIO / COMMAND</span></div><button type="button" onClick={() => setOpen(false)} aria-label="Close command palette"><X size={16} /></button></header>
        <label className="studio-command-search"><Search size={17} /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Jump to a workspace…" aria-label="Search commands" /></label>
        <div className="studio-command-results">
          {matches.length ? matches.map((item) => <button key={item.href} type="button" onClick={() => go(item.href)}><span className="studio-command-results__group">{item.group}</span><span className="studio-command-results__copy"><strong>{item.label}</strong><small>{item.detail}</small></span><CornerDownLeft size={14} /></button>) : <p>No existing workspace command matches that search.</p>}
        </div>
        <footer><span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span><span><kbd>Esc</kbd> Close</span></footer>
      </section>
    </div>}
  </>;
}
