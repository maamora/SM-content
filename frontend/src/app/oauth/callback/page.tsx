"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setToken } from "@/lib/api/client";
import { getCurrentUser } from "@/lib/api/auth";

export default function OAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = params.get("token");
    if (!token) {
      router.replace("/login?oauth=error&message=Google%20sign-in%20did%20not%20return%20a%20session.");
      return;
    }
    setToken(token);
    // A brand-new Google sign-up has no brand yet — send them to the
    // onboarding chooser instead of straight into the dashboard, which used
    // to silently drop them into an existing customer's workspace.
    getCurrentUser()
      .then((me) => router.replace(me.brandId ? "/dashboard" : "/onboarding"))
      .catch(() => router.replace("/onboarding"));
  }, [router]);

  return <main className="studio-utility"><div className="studio-loading">Completing Google sign-in…</div></main>;
}
