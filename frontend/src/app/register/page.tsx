"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, Loader2 } from "lucide-react";
import { RegisterSchema, RegisterInput } from "@/schemas/auth";
import { register as registerAccount } from "@/lib/api/auth";

interface FormGroupProps {
    id: string;
    label: string;
    error?: FieldError;
    children: React.ReactNode;
}

function FormGroup({ id, label, error, children }: FormGroupProps) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="text-[10px] font-black uppercase tracking-wider text-stone-500">
                {label}
            </label>
            {children}
            {error && (
                <p role="alert" id={`${id}-error`} className="text-xs text-red-600 font-bold">
                    {error.message}
                </p>
            )}
        </div>
    );
}

const inputStyles = "flex w-full h-11 rounded-xl border-2 border-stone-900 bg-white px-3.5 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus-visible:ring-2 focus-visible:ring-[#F47315] focus-visible:outline-none transition-all disabled:opacity-50 font-medium";

export default function RegisterPage() {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<RegisterInput>({
        resolver: zodResolver(RegisterSchema),
        defaultValues: { name: "", email: "", password: "" },
    });

    const onSubmit = async (data: RegisterInput) => {
        setServerError(null);
        setIsSubmitting(true);
        try {
            await registerAccount(data);
            router.push("/");
        } catch (err) {
            setServerError(err instanceof Error ? err.message : "Registration failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-gradient-to-br from-[#FFFDF9] via-[#FFF3E8] to-[#FFE5D3]">
            <div className="w-full max-w-sm">
                <div className="mb-6 flex flex-col items-center gap-3">
                    <div className="h-14 w-14 rounded-2xl bg-white border-3 border-stone-900 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] flex items-center justify-center p-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/maamora-logo.png" alt="Maamora" className="h-full w-full object-contain" />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-black">Maamora Studio</span>
                </div>

                <div className="p-8 bg-white border-3 border-stone-900 rounded-3xl shadow-[6px_6px_0px_0px_rgba(28,25,23,1)]">
                    <div className="mb-6 space-y-1">
                        <h1 className="text-xl font-black text-stone-900 tracking-tight font-serif">Créer un compte</h1>
                        <p className="text-xs text-stone-400 font-medium">Rejoignez l&apos;espace de travail Maamora.</p>
                    </div>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <FormGroup id="name" label="Votre nom" error={form.formState.errors.name}>
                            <input
                                id="name"
                                className={inputStyles}
                                placeholder="Ayoub"
                                aria-invalid={!!form.formState.errors.name}
                                {...form.register("name")}
                            />
                        </FormGroup>

                        <FormGroup id="email" label="Email" error={form.formState.errors.email}>
                            <input
                                id="email"
                                type="email"
                                className={inputStyles}
                                placeholder="vous@maamora.com"
                                aria-invalid={!!form.formState.errors.email}
                                {...form.register("email")}
                            />
                        </FormGroup>

                        <FormGroup id="password" label="Mot de passe" error={form.formState.errors.password}>
                            <input
                                id="password"
                                type="password"
                                className={inputStyles}
                                placeholder="8 caractères minimum"
                                aria-invalid={!!form.formState.errors.password}
                                {...form.register("password")}
                            />
                        </FormGroup>

                        {serverError && (
                            <p role="alert" className="text-xs text-red-600 font-bold bg-red-50 border-2 border-red-200 rounded-xl px-3 py-2">
                                {serverError}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center justify-center gap-2 rounded-xl text-xs font-extrabold h-11 px-6 w-full bg-[#F47315] hover:bg-[#ff852e] text-white border-b-2 border-stone-900 shadow-[3px_3px_0px_0px_rgba(28,25,23,1)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Création...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="h-4 w-4" />
                                    Créer mon compte
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-xs text-stone-400 font-medium">
                        Déjà un compte ?{" "}
                        <Link href="/login" className="text-[#F47315] hover:text-[#ff852e] font-extrabold">
                            Se connecter
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
