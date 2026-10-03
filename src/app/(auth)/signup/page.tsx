import Link from "next/link";
import { Layers } from "lucide-react";
import { SignupForm } from "./signup-form";
export default function SignupPage() {return <main className="flex min-h-screen items-center justify-center bg-[#f4f5f8] p-6"><div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-white p-8 shadow-sm"><Layers size={30} strokeWidth={1.5}/><h1 className="mt-6 text-3xl font-semibold tracking-tight">Your business starts here.</h1><p className="mb-7 mt-3 text-sm text-[var(--color-ink-muted)]">Create a private Atlas workspace for your team.</p><SignupForm/><p className="mt-6 text-center text-sm text-[var(--color-ink-muted)]">Already have an account? <Link href="/login" className="text-[var(--color-atlas-blue)]">Sign in</Link></p></div></main>;}
