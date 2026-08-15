"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setToken } from "@/lib/api/client";

export default function OAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = params.get("token");
    if (token) {
      setToken(token);
      router.replace("/dashboard");
    } else {
      router.replace("/login?oauth=error&message=Google%20sign-in%20did%20not%20return%20a%20session.");
    }
  }, [router]);

  return <main className="studio-utility"><div className="studio-loading">Completing Google sign-in…</div></main>;
}
