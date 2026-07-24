"use client";

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
            className="text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
        >
            Sign out
        </button>
    );
}
