import { LoginForm } from "@/app/(auth)/login/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-app-bg)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">Atlas</span>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Sign in to your business.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
