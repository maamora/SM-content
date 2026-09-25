"use client";
/* PRESS BENCH PRIMITIVES: authenticated-only production shell with a compact tool dock, job strip, and route-specific work field. These components never replace data, API behavior, or honest unavailable states. */

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { CircleHelp, LogOut, Palette, User } from "lucide-react";
import { StudioMark } from "./StudioShell";
import type { BrandSettings } from "@/lib/api/brand";
import { logout } from "@/lib/api/auth";

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
  /** Tenant's own brand (logo + name) — shows in place of the generic STUDIO mark
   *  once loaded. Optional/nullable since it loads asynchronously after mount. */
  brand?: BrandSettings | null;
};

export function EditionDeskShell({
  activeKey,
  contextLabel,
  navigation,
  children,
  footerPrimaryHref = "/contact",
  footerPrimaryLabel = "Support",
  footerPrimaryIcon: FooterPrimaryIcon = CircleHelp,
  brand,
}: EditionDeskShellProps) {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  const doLogout = () => { logout(); router.push("/login"); };

  return (
    <main className="studio-app studio-app--press-bench">
      <aside className="studio-workspace-sidebar studio-bench-dock" aria-label={`${contextLabel} navigation`}>
        <div className="studio-workspace-sidebar__brand studio-bench-dock__brand">
          {brand?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logoUrl} alt={brand.name || "Brand logo"} className="studio-bench-dock__brand-logo" />
          ) : (
            <StudioMark compact />
          )}
          <span>{contextLabel}</span>
        </div>
        <nav className="studio-bench-dock__nav">
          {navigation.map((section) => (
            <div className="studio-workspace-nav__section" key={section.label ?? section.items.map((item) => item.key).join("-")}>
              {section.label && <span>{section.label}</span>}
              {section.items.map(({ key, label, href, icon: Icon }) => (
                <Link key={key} href={href} className={activeKey === key ? "is-active" : ""} aria-current={activeKey === key ? "page" : undefined} data-label={label} title={label}>
                  <Icon size={17} /><span>{label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="studio-workspace-sidebar__bottom studio-bench-dock__footer">
          <Link href={footerPrimaryHref} title={footerPrimaryLabel}><FooterPrimaryIcon size={16} /><span>{footerPrimaryLabel}</span></Link>
          <Link href="/" title="Back to site"><span>←</span><span>Back to site</span></Link>
          <div className="studio-bench-dock__profile-wrap" ref={menuRef}>
            <button
              type="button"
              title="Your account"
              aria-label="Your account"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="studio-bench-dock__profile"
              onClick={() => setMenuOpen((value) => !value)}
            >
              <User size={18} />
            </button>
            {menuOpen && (
              <div className="studio-bench-dock__profile-menu" role="menu">
                <Link href="/dashboard/settings" role="menuitem" onClick={() => setMenuOpen(false)}>
                  <User size={14} /> Profile
                </Link>
                <Link href="/dashboard/settings?tab=brand" role="menuitem" onClick={() => setMenuOpen(false)}>
                  <Palette size={14} /> Brand settings
                </Link>
                <button type="button" role="menuitem" onClick={doLogout}>
                  <LogOut size={14} /> Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
      <div className="studio-workspace-main studio-bench-workspace">{children}</div>
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
    <header className={`studio-route-masthead studio-job-strip ${compact ? "studio-route-masthead--compact" : ""}`}>
      <div className="studio-route-masthead__copy studio-job-strip__record"><span className="studio-kicker studio-kicker--dark">{kicker}</span><div><h1>{title}</h1><p>{description}</p></div>{children}</div>
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
    <div className="studio-route-controlbar studio-job-strip__tools">
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
    <section className={`studio-work-sheet studio-bench-sheet studio-work-sheet--${tone} ${className}`}>
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
    <div className={`studio-metric-ledger studio-bench-ledger ${className}`}>
      {items.map((item) => <div className={`studio-metric-ledger__cell studio-metric-ledger__cell--${item.accent ?? "blue"}`} key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.detail}</small></div>)}
    </div>
  );
}
