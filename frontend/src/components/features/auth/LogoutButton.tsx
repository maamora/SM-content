"use client";

/* STUDIO editorial refresh: authentication exits use quiet, uppercase utility actions. */
import { useRouter } from "next/navigation";
import { logout } from "@/lib/api/auth";

export function LogoutButton() {
    const router = useRouter();

    return (
        <button
            onClick={() => {
                logout();
                router.push("/login");
            }}
            className="studio-text-button text-xs uppercase tracking-[0.12em]"
        >
            Sign out
        </button>
    );
}
