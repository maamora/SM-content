"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/api/client";

export function RequireAuth({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.replace("/login");
            return;
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time auth check on mount before rendering protected content
        setChecked(true);
    }, [router]);

    if (!checked) return null;

    return <>{children}</>;
}
