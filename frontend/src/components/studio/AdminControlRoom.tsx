"use client";
/* ADMIN CONTROL ROOM: governance-only shell with separate navigation, system context, and operational panels. It never exposes member creative actions. */

import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, CircleDot, RefreshCw, ShieldCheck } from "lucide-react";
import { StudioMark } from "./StudioShell";

export type AdminControlNavItem = { key: string; label: string; href: string; icon: LucideIcon };
export type AdminControlNavSection = { label: string; items: AdminControlNavItem[] };

type AdminControlRoomProps = {
  activeKey: string;
  sections: AdminControlNavSection[];
  kicker: string;
  title: string;
  utility?: ReactNode;
  children: ReactNode;
};

export function AdminControlRoom({ activeKey, sections, kicker, title, utility, children }: AdminControlRoomProps) {
  return <main className="studio-app studio-admin-app">
    <aside className="studio-admin-rail" aria-label="Admin control room navigation">
      <header className="studio-admin-rail__brand"><StudioMark compact /><div><small>CONTROL ROOM</small></div></header>
      <div className="studio-admin-rail__status"><CircleDot size={13} /><span>ADMIN SESSION</span></div>
      <nav>{sections.map((section) => <section key={section.label}><span>{section.label}</span>{section.items.map(({ key, label, href, icon: Icon }) => <Link key={key} href={href} className={activeKey === key ? "is-active" : ""} aria-current={activeKey === key ? "page" : undefined}><Icon size={15} /><span>{label}</span></Link>)}</section>)}</nav>
      <footer><Link href="/dashboard"><ArrowLeft size={15} /> Member workspace</Link><Link href="/"><ShieldCheck size={15} /> Public site</Link></footer>
    </aside>
    <section className="studio-admin-main">
      <header className="studio-admin-header"><div><span>{kicker}</span><h1>{title}</h1></div><div className="studio-admin-header__actions"><div className="studio-admin-live"><i /><span>ADMIN</span></div>{utility}</div></header>
      <div className="studio-admin-commandbar"><div><ShieldCheck size={16} /><span>CONTROL PLANE</span></div><span>Read-only where no audited mutation route exists.</span></div>
      <div className="studio-admin-content">{children}</div>
    </section>
  </main>;
}
