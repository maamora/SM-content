"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LogOut, Upload, User2, Users2, X } from "lucide-react";
import { getCurrentUser, logout, uploadBrandLogo } from "@/lib/api/auth";
import { completeOnboarding } from "@/lib/api/users";
import { StudioMark } from "@/components/studio/StudioShell";

type Path = "personal" | "create" | "join" | null;

/**
 * Reached only by an authenticated account with no brand yet — today that's
 * exclusively a fresh Google sign-up (see AuthService.loginOrCreateGoogle
 * and oauth/callback/page.tsx, which redirects here instead of /dashboard
 * when getCurrentUser().brandId is null). Every brand-scoped API 404s until
 * this is completed, so there's no way to reach real workspace data by
 * skipping it.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [path, setPath] = useState<Path>(null);
  const [brandName, setBrandName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [logoUploading, setLogoUploading] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((me) => {
        // Already configured (or an existing account that reached this URL
        // directly) — nothing to do here.
        if (me.brandId) router.replace("/dashboard");
        else setChecking(false);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const handleLogoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const { url } = await uploadBrandLogo(file);
      setLogoUrl(url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to upload logo");
    } finally {
      setLogoUploading(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (path === "personal") await completeOnboarding({ personal: true });
      else if (path === "join") await completeOnboarding({ joinCode });
      else await completeOnboarding({ brandName, logoUrl });
      router.push("/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <main className="studio-onboarding">
        <div className="studio-onboarding__glow studio-onboarding__glow--a" />
        <div className="studio-onboarding__glow studio-onboarding__glow--b" />
        <div className="studio-onboarding__sparks" aria-hidden="true">
          <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
            <path className="studio-onboarding__spark-path studio-onboarding__spark-path--1" d="M -80,120 C 120,20 200,260 380,180 C 480,140 420,40 520,60 C 620,80 560,220 680,240 C 850,270 900,80 1100,140 C 1300,200 1350,380 1550,320" />
            <path className="studio-onboarding__spark-path studio-onboarding__spark-path--2" d="M -60,480 C 200,420 260,600 420,520 C 560,450 480,300 620,320 C 800,345 760,560 900,540 C 980,528 1000,420 1120,460 C 1300,520 1250,650 1450,600" />
            <path className="studio-onboarding__spark-path studio-onboarding__spark-path--3" d="M -40,760 C 180,700 220,820 380,760 C 520,710 500,600 640,650 C 800,705 780,830 940,800 C 1100,770 1120,650 1300,700 C 1450,745 1480,650 1650,690" />
          </svg>
        </div>
        <div className="studio-loading" style={{ position: "relative", zIndex: 1 }}>
          <LoaderCircle className="studio-spin" size={18} /> Loading…
        </div>
      </main>
    );
  }

  return (
    <main className="studio-onboarding">
      <div className="studio-onboarding__glow studio-onboarding__glow--a" />
      <div className="studio-onboarding__glow studio-onboarding__glow--b" />
      <div className="studio-onboarding__glow studio-onboarding__glow--c" />
      <div className="studio-onboarding__sparks" aria-hidden="true">
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
          <path className="studio-onboarding__spark-path studio-onboarding__spark-path--1" d="M -80,120 C 120,20 200,260 380,180 C 480,140 420,40 520,60 C 620,80 560,220 680,240 C 850,270 900,80 1100,140 C 1300,200 1350,380 1550,320" />
          <path className="studio-onboarding__spark-path studio-onboarding__spark-path--2" d="M -60,480 C 200,420 260,600 420,520 C 560,450 480,300 620,320 C 800,345 760,560 900,540 C 980,528 1000,420 1120,460 C 1300,520 1250,650 1450,600" />
          <path className="studio-onboarding__spark-path studio-onboarding__spark-path--3" d="M -40,760 C 180,700 220,820 380,760 C 520,710 500,600 640,650 C 800,705 780,830 940,800 C 1100,770 1120,650 1300,700 C 1450,745 1480,650 1650,690" />
        </svg>
      </div>
      <div className="studio-onboarding__grid" />

      <div className="studio-onboarding__panel">
        <StudioMark />
        <span className="studio-kicker studio-kicker--dark" style={{ marginTop: 22 }}>ONE LAST STEP</span>
        <h1>How do you want to use STUDIO?</h1>
        <p>Pick one — this decides what shows up when you land in your workspace. You can invite teammates or change details later.</p>

        {!path ? (
          <div className="studio-onboarding__tiles">
            <button type="button" className="studio-onboarding__tile" onClick={() => setPath("create")}>
              <Users2 size={22} />
              <strong>Create a brand</strong>
              <small>Set up a workspace for your company or product — name, logo, and a code to invite your team.</small>
            </button>
            <button type="button" className="studio-onboarding__tile" onClick={() => setPath("join")}>
              <Upload size={22} style={{ transform: "rotate(90deg)" }} />
              <strong>Join with a code</strong>
              <small>Already have a workspace code from a teammate? Enter it to land in their brand instead.</small>
            </button>
            <button type="button" className="studio-onboarding__tile" onClick={() => setPath("personal")}>
              <User2 size={22} />
              <strong>Just me</strong>
              <small>A personal space to post your own content — no brand name or team required.</small>
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="studio-onboarding__form">
            {path === "create" && (
              <>
                <label>Brand name
                  <input required autoFocus value={brandName} onChange={(event) => setBrandName(event.target.value)} placeholder="Your brand's name" />
                </label>
                <label>Brand logo (optional)
                  <div className="flex items-center gap-3">
                    {logoUrl ? (
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden border border-[rgba(255,255,255,.2)] bg-[rgba(255,255,255,.05)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logoUrl} alt="Brand logo preview" className="h-full w-full object-contain" />
                        <button type="button" onClick={() => setLogoUrl(undefined)} className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center bg-[var(--studio-lime)] text-[var(--studio-ink)]" aria-label="Remove logo">
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex" }} className={`h-14 w-14 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-[rgba(255,255,255,.3)] ${logoUploading ? "pointer-events-none opacity-60" : ""}`}>
                        {logoUploading ? <LoaderCircle size={14} className="studio-spin" /> : <Upload size={14} />}
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleLogoSelected} disabled={logoUploading} className="hidden" id="onboarding-logo-input" />
                    <label htmlFor="onboarding-logo-input" className="studio-text-button" style={{ cursor: "pointer" }}>
                      {logoUrl ? "Change logo" : "Upload"}
                    </label>
                  </div>
                </label>
              </>
            )}
            {path === "join" && (
              <label>Workspace code
                <input
                  required
                  autoFocus
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                  placeholder="e.g. 7K4M9XPQ"
                  maxLength={8}
                  style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}
                />
              </label>
            )}
            {path === "personal" && (
              <p className="studio-inline-notice">You&apos;ll get your own space to post — nothing else to fill in.</p>
            )}
            {error && <p className="studio-form-error" role="alert">{error}</p>}
            <div className="flex items-center gap-3" style={{ marginTop: 6 }}>
              <button type="button" className="studio-button studio-button--paper" onClick={() => { setPath(null); setError(null); }}>
                Back
              </button>
              <button disabled={submitting || logoUploading} className="studio-button studio-button--lime" type="submit">
                {submitting ? <LoaderCircle size={16} className="studio-spin" /> : null}
                {submitting ? "Setting up…" : "Enter STUDIO"}
              </button>
            </div>
          </form>
        )}

        <button type="button" className="studio-onboarding__signout" onClick={() => { logout(); router.replace("/login"); }}>
          <LogOut size={13} /> Sign out instead
        </button>
      </div>
    </main>
  );
}
