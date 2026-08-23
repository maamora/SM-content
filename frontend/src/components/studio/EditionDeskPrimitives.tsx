"use client";
/* EDITION DESK PRIMITIVES: authenticated-only layout architecture built from a quiet index rail, a single route thesis, operational controls, and durable work sheets. These components are presentational and never replace data, API behavior, or honest unavailable states. */

import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CircleHelp } from "lucide-react";
import { StudioMark } from "./StudioShell";

export type EditionNavItem = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
};

export type EditionNavSection = {
  label?: string;
  items: EditionNavItem[];
};

type EditionDeskShellProps = {
  activeKey: string;
  contextLabel: string;
  navigation: EditionNavSection[];
  children: ReactNode;
  footerPrimaryHref?: string;
  footerPrimaryLabel?: string;
  footerPrimaryIcon?: LucideIcon;
};

export function EditionDeskShell({
  activeKey,
  contextLabel,
  navigation,
  children,
  footerPrimaryHref = "/contact",
  footerPrimaryLabel = "Support",
  footerPrimaryIcon: FooterPrimaryIcon = CircleHelp,
}: EditionDeskShellProps) {
  return (
    <main className="studio-app studio-app--edition-desk">
      <aside className="studio-workspace-sidebar" aria-label={`${contextLabel} navigation`}>
        <div className="studio-workspace-sidebar__brand"><StudioMark compact /><span>{contextLabel}</span></div>
        <nav>
          {navigation.map((section) => (
            <div className="studio-workspace-nav__section" key={section.label ?? section.items.map((item) => item.key).join("-")}>
              {section.label && <span>{section.label}</span>}
              {section.items.map(({ key, label, href, icon: Icon }) => (
                <Link key={key} href={href} className={activeKey === key ? "is-active" : ""} aria-current={activeKey === key ? "page" : undefined}>
                  <Icon size={16} />{label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="studio-workspace-sidebar__bottom">
          <Link href={footerPrimaryHref}><FooterPrimaryIcon size={15} />{footerPrimaryLabel}</Link>
          <Link href="/">← Back to site</Link>
        </div>
      </aside>
      <div className="studio-workspace-main">{children}</div>
    </main>
  );
}

type RouteMastheadProps = {
  kicker: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children?: ReactNode;
  compact?: boolean;
};

export function RouteMasthead({ kicker, title, description, actions, children, compact = false }: RouteMastheadProps) {
  return (
    <header className={`studio-route-masthead ${compact ? "studio-route-masthead--compact" : ""}`}>
      <div className="studio-route-masthead__copy"><span className="studio-kicker studio-kicker--dark">{kicker}</span><h1>{title}</h1><p>{description}</p>{children}</div>
      {actions && <div className="studio-route-masthead__actions">{actions}</div>}
    </header>
  );
}

type RouteControlBarProps = {
  icon: LucideIcon;
  label: string;
  utility?: ReactNode;
  children?: ReactNode;
};

export function RouteControlBar({ icon: Icon, label, utility, children }: RouteControlBarProps) {
  return (
    <div className="studio-route-controlbar">
      <div className="studio-route-controlbar__label"><Icon size={17} /><span>{label}</span></div>
      <div className="studio-route-controlbar__actions">{children}{utility}</div>
    </div>
  );
}

type WorkSheetProps = {
  kicker?: string;
  title?: string;
  meta?: ReactNode;
  tone?: "paper" | "ink";
  className?: string;
  children: ReactNode;
};

export function WorkSheet({ kicker, title, meta, tone = "paper", className = "", children }: WorkSheetProps) {
  return (
    <section className={`studio-work-sheet studio-work-sheet--${tone} ${className}`}>
      {(kicker || title || meta) && <div className="studio-work-sheet__heading"><div>{kicker && <span className="studio-kicker studio-kicker--dark">{kicker}</span>}{title && <h2>{title}</h2>}</div>{meta && <div className="studio-work-sheet__meta">{meta}</div>}</div>}
      <div className="studio-work-sheet__body">{children}</div>
    </section>
  );
}

export type MetricLedgerItem = {
  label: string;
  value: ReactNode;
  detail: string;
  accent?: "blue" | "ink" | "vermilion";
};

export function MetricLedger({ items, className = "" }: { items: MetricLedgerItem[]; className?: string }) {
  return (
    <div className={`studio-metric-ledger ${className}`}>
      {items.map((item) => <div className={`studio-metric-ledger__cell studio-metric-ledger__cell--${item.accent ?? "blue"}`} key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.detail}</small></div>)}
    </div>
  );
}
