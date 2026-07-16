"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, LoginInput } from "@/schemas/auth";
import { login } from "@/lib/api/auth";

interface FormGroupProps {
    id: string;
    label: string;
    error?: FieldError;
    children: React.ReactNode;
}

function FormGroup({ id, label, error, children }: FormGroupProps) {
    return (
        <div className="space-y-2">
            <label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                {label}
            </label>
            {children}
            {error && (
                <p role="alert" id={`${id}-error`} className="text-xs text-red-500 font-medium">
                    {error.message}
                </p>
            )}
        </div>
    );
}

const inputStyles = "flex w-full h-9 rounded-md border border-zinc-900 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:outline-none transition-colors disabled:opacity-50";

export default function LoginPage() {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<LoginInput>({
        resolver: zodResolver(LoginSchema),
        defaultValues: { email: "", password: "" },
    });

    const onSubmit = async (data: LoginInput) => {
        setServerError(null);
        setIsSubmitting(true);
        try {
            await login(data);
            router.push("/");
        } catch (err) {
            setServerError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-sm p-8 bg-zinc-900/10 border border-zinc-900 rounded-xl shadow-sm">
                <div className="mb-6 space-y-1">
                    <h1 className="text-lg font-semibold text-zinc-100 tracking-tight">Sign in</h1>
                    <p className="text-xs text-zinc-500">Access your Maamora content studio.</p>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormGroup id="email" label="Email" error={form.formState.errors.email}>
                        <input
                            id="email"
                            type="email"
                            className={inputStyles}
                            placeholder="you@maamora.com"
                            aria-invalid={!!form.formState.errors.email}
                            {...form.register("email")}
                        />
                    </FormGroup>

                    <FormGroup id="password" label="Password" error={form.formState.errors.password}>
                        <input
                            id="password"
                            type="password"
                            className={inputStyles}
                            placeholder="••••••••"
                            aria-invalid={!!form.formState.errors.password}
                            {...form.register("password")}
                        />
                    </FormGroup>

                    {serverError && (
                        <p role="alert" className="text-xs text-red-500 font-medium">
                            {serverError}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center rounded-md text-xs font-semibold h-9 px-6 w-full bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_1px_5px_rgba(234,88,12,0.3)]"
                    >
                        {isSubmitting ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <p className="mt-6 text-center text-xs text-zinc-500">
                    No account yet?{" "}
                    <Link href="/register" className="text-orange-500 hover:text-orange-400 font-medium">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
}
