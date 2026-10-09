import Link from "next/link";
import { LoginForm } from "@/app/(auth)/login/login-form";
import { AuthFrame } from "@/components/shell/auth-frame";

export default function LoginPage() {
  return (
    <AuthFrame title="Sign in" footer="Accounts are set up by Atlas. Sign in with your password, or use a setup code if you were given one.">
      <LoginForm /><p className="mt-5 text-center text-sm"><Link href="/atlas/login" className="text-blue-700">Atlas Admin sign in</Link></p>
    </AuthFrame>
  );
}
