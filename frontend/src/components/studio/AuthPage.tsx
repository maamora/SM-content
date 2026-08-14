"use client";

"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowUpRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { login, register as registerAccount } from "@/lib/api/auth";
import { StudioMark } from "./StudioShell";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const router = useRouter(); const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setError(null); setLoading(true); try { if (mode === "login") await login({ email, password }); else await registerAccount({ name, email, password }); router.push("/dashboard"); } catch (caught) { setError(caught instanceof Error ? caught.message : "Something went wrong"); } finally { setLoading(false); } };
  return <main className="studio-utility"><div className="studio-auth-grid"><div className="studio-auth-aside"><Link href="/" className="studio-utility__back">← STUDIO</Link><div><p className="studio-kicker">A CLEARER WAY TO MAKE</p><h1>Make the work<br /><em>move.</em></h1><p>Creative operations for the drafts, directions, and decisions that make a brand feel alive.</p></div><span>STUDIO / {mode === "login" ? "RETURNING MAKER" : "NEW WORKSPACE"}</span></div><section className="studio-auth-card"><StudioMark /><span className="studio-kicker studio-kicker--dark">STUDIO / {mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}</span><h2>{mode === "login" ? "Welcome back." : "Give the work a room."}</h2><p>{mode === "login" ? "Pick up where the last good draft left off." : "Start with a workspace built around your point of view."}</p><form onSubmit={submit} className="studio-auth-form">{mode === "register" && <label>Name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></label>}<label>Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@team.com" /></label><label>Password<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8 characters minimum" /></label>{error && <p className="studio-form-error" role="alert">{error}</p>}<button disabled={loading} className="studio-button studio-button--lime studio-button--large" type="submit">{loading ? <LoaderCircle size={16} className="studio-spin" /> : null}{loading ? "Working..." : mode === "login" ? "Enter STUDIO" : "Create workspace"}<ArrowUpRight size={16} /></button></form><div className="studio-auth-links">{mode === "login" ? <><Link href="/forgot-password">Forgot password?</Link><span>New here? <Link href="/register">Create an account</Link></span></> : <span>Already have a workspace? <Link href="/login">Sign in</Link></span>}</div></section></div></main>;
}
