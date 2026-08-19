"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowUpRight, LoaderCircle, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { login, register as registerAccount, uploadBrandLogo } from "@/lib/api/auth";
import { StudioMark } from "./StudioShell";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // "create" = new isolated brand workspace (name + logo below). "join" =
  // attach to a teammate's existing brand via their generated code instead —
  // see BrandSettingsService.joinExisting on the backend. Exactly one of
  // brandName / joinCode is sent, never both.
  const [signupMode, setSignupMode] = useState<"create" | "join">("create");
  const [brandName, setBrandName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  // Honeypot — never shown to a real user (positioned off-screen, not just
  // display:none, since some bots skip visually-hidden-but-still-"visible"
  // fields differently). Left blank by any real submission.
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoError(null);
    setLogoUploading(true);
    try {
      const { url } = await uploadBrandLogo(file);
      setLogoUrl(url);
    } catch (caught) {
      setLogoError(caught instanceof Error ? caught.message : "Failed to upload logo");
    } finally {
      setLogoUploading(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") await login({ email, password });
      else if (signupMode === "join") await registerAccount({ name, email, password, joinCode, website });
      else await registerAccount({ name, email, password, brandName, logoUrl, website });
      router.push("/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="studio-utility">
      <div className="studio-auth-grid">
        <div className="studio-auth-aside">
          <Link href="/" className="studio-utility__back">← STUDIO</Link>
          <div>
            <p className="studio-kicker">A CLEARER WAY TO MAKE</p>
            <h1>Make the work<br /><em>move.</em></h1>
            <p>Creative operations for the drafts, directions, and decisions that make a brand feel alive.</p>
          </div>
          <span>STUDIO / {mode === "login" ? "RETURNING MAKER" : "NEW WORKSPACE"}</span>
        </div>
        <section className="studio-auth-card">
          <StudioMark />
          <span className="studio-kicker studio-kicker--dark">STUDIO / {mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}</span>
          <h2>{mode === "login" ? "Welcome back." : "Give the work a room."}</h2>
          <p>{mode === "login" ? "Pick up where the last good draft left off." : "Start with a workspace built around your point of view."}</p>
          <form onSubmit={submit} className="studio-auth-form">
            {mode === "register" && (
              <>
                {/* Honeypot: real users never see this (off-screen, aria-hidden,
                    not tab-reachable) — bots that autofill every field tend to
                    fill it anyway, which is exactly what gives them away. */}
                <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }} aria-hidden="true">
                  <label htmlFor="brand-website-hp">Leave this field empty</label>
                  <input
                    id="brand-website-hp"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                  />
                </div>

                <label>Name
                  <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSignupMode("create")}
                    className={`studio-button flex-1 ${signupMode === "create" ? "studio-button--dark" : "studio-button--paper"}`}
                  >
                    New brand
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignupMode("join")}
                    className={`studio-button flex-1 ${signupMode === "join" ? "studio-button--dark" : "studio-button--paper"}`}
                  >
                    Join with a code
                  </button>
                </div>

                {signupMode === "join" ? (
                  <label>Workspace code
                    <input
                      required
                      value={joinCode}
                      onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                      placeholder="e.g. 7K4M9XPQ"
                      maxLength={8}
                      style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}
                    />
                  </label>
                ) : (
                <>
                <label>Brand name
                  <input required value={brandName} onChange={(event) => setBrandName(event.target.value)} placeholder="Your brand's name" />
                </label>
                <label>Brand logo (optional)
                  <div className="flex items-center gap-3">
                    {logoUrl ? (
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden border border-[#bdbdb4] bg-[#f8f7f1]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logoUrl} alt="Brand logo preview" className="h-full w-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setLogoUrl(undefined)}
                          className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center bg-[var(--studio-ink)] text-white"
                          aria-label="Remove logo"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`flex h-14 w-14 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-[#bdbdb4] transition-colors hover:border-[var(--studio-lime)] ${logoUploading ? "pointer-events-none opacity-60" : ""}`}
                      >
                        {logoUploading ? (
                          <LoaderCircle size={14} className="studio-spin" />
                        ) : (
                          <Upload size={14} className="text-[#91918b]" />
                        )}
                      </div>
                    )}
                    <span className="text-[11px] font-normal normal-case tracking-normal text-[#8b8b83]">
                      {logoUploading ? "Envoi..." : logoUrl ? "Logo uploaded — click × to change" : "PNG or JPG, square works best"}
                    </span>
                  </div>
                  <input
                    id="brand-logo-input"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoSelected}
                    disabled={logoUploading}
                    className="hidden"
                  />
                </label>
                {logoError && <p className="studio-form-error" role="alert">{logoError}</p>}
                </>
                )}
              </>
            )}
            <label>Email
              <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@team.com" />
            </label>
            <label>Password
              <input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8 characters minimum" />
            </label>
            {error && <p className="studio-form-error" role="alert">{error}</p>}
            <button disabled={loading || logoUploading} className="studio-button studio-button--lime studio-button--large" type="submit">
              {loading ? <LoaderCircle size={16} className="studio-spin" /> : null}
              {loading ? "Working..." : mode === "login" ? "Enter STUDIO" : "Create workspace"}
              <ArrowUpRight size={16} />
            </button>
          </form>
          <div className="studio-auth-links">
            {mode === "login" ? (
              <>
                <Link href="/forgot-password">Forgot password?</Link>
                <span>New here? <Link href="/register">Create an account</Link></span>
              </>
            ) : (
              <span>Already have a workspace? <Link href="/login">Sign in</Link></span>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
