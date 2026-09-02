"use client";

/* STUDIO onboarding: a short, tactile handoff from account creation to an intentionally configured brand workspace. */
import Link from "next/link";
import { ArrowRight, Check, Loader2, Palette, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/features/auth/RequireAuth";
import { getBrand, updateBrand } from "@/lib/api/brand";

const palettes = [
  { name: "Signal", primary: "#B9FF43", secondary: "#11110F" },
  { name: "Terre", primary: "#D7B28F", secondary: "#35251D" },
  { name: "Atlas", primary: "#AABF96", secondary: "#183F34" },
] as const;

function OnboardingContent() {
  const router = useRouter();
  const [brandName, setBrandName] = useState("");
  const [tone, setTone] = useState("");
  const [palette, setPalette] = useState<(typeof palettes)[number]>(palettes[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getBrand().then((brand) => {
      setBrandName(brand.configured ? brand.name : "");
      setTone(brand.toneGuidelines ?? "");
      const matching = palettes.find((item) => item.primary === brand.primaryColor && item.secondary === brand.secondaryColor);
      if (matching) setPalette(matching);
    }).catch((caught) => setError(caught instanceof Error ? caught.message : "The brand workspace could not be prepared."))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!brandName.trim()) { setError("Add the name you want to see on your workspace."); return; }
    setSaving(true); setError(null);
    try {
      await updateBrand({
        name: brandName.trim(),
        primaryColor: palette.primary,
        secondaryColor: palette.secondary,
        fontFamily: "STUDIO Editorial",
        toneGuidelines: tone.trim(),
        logoUrl: null,
      });
      router.push("/dashboard/brand");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your first direction could not be saved.");
    } finally { setSaving(false); }
  };

  return <main className="studio-onboarding studio-starfield">
    <div className="studio-shell studio-onboarding__shell">
      <header className="studio-onboarding__header"><Link href="/" className="studio-utility__back">← STUDIO</Link><span>WORKSPACE SETUP / 01—03</span></header>
      <section className="studio-onboarding__lead">
        <p className="studio-kicker">MAKE THE EMPTY CANVAS YOURS</p>
        <h1>Start with a<br /><em>point of view.</em></h1>
        <p>Set a name, choose a starting signal, and leave the rest deliberately open. You can add a logo in Brand when it is ready.</p>
      </section>
      <section className="studio-onboarding__panel" aria-busy={loading}>
        <div className="studio-onboarding__panel-meta"><span><Sparkles size={14} /> Your first direction</span><b>{loading ? "LOADING" : "LIVE"}</b></div>
        <div className="studio-onboarding__fields">
          <label>Brand or workspace name<input value={brandName} onChange={(event) => setBrandName(event.target.value)} maxLength={80} placeholder="e.g. Atelier Noura" disabled={loading || saving} /></label>
          <label>Creative tone <textarea value={tone} onChange={(event) => setTone(event.target.value)} maxLength={300} placeholder="e.g. sharp, local, generous — never generic" rows={3} disabled={loading || saving} /></label>
        </div>
        <div className="studio-onboarding__palette"><div><span className="studio-kicker studio-kicker--dark">STARTING SIGNAL</span><p>These are editable foundations, not a locked identity.</p></div><div className="studio-onboarding__palette-options">{palettes.map((item) => <button type="button" key={item.name} className={palette.name === item.name ? "is-selected" : ""} onClick={() => setPalette(item)} disabled={loading || saving}><span style={{ background: item.primary }} /><span style={{ background: item.secondary }} /><b>{item.name}</b>{palette.name === item.name && <Check size={13} />}</button>)}</div></div>
        {error && <p className="studio-form-error" role="alert">{error}</p>}
        <div className="studio-onboarding__actions"><button type="button" className="studio-button studio-button--lime studio-button--large" disabled={loading || saving} onClick={() => void save()}>{saving ? <Loader2 className="studio-spin" size={16} /> : <Palette size={16} />}{saving ? "Saving direction…" : "Continue to Brand"}<ArrowRight size={16} /></button><Link href="/dashboard" className="studio-button studio-button--quiet">Keep the workspace neutral</Link></div>
      </section>
    </div>
  </main>;
}

export function OnboardingFlow() { return <RequireAuth><OnboardingContent /></RequireAuth>; }
