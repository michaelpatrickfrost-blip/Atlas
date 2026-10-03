import Link from "next/link";
import { LoginForm } from "@/app/(auth)/login/login-form";
import { AuthFrame } from "@/components/shell/auth-frame";

export default function LoginPage() {
  return (
    <AuthFrame title="Welcome back." subtitle="Sign in to your company workspace." footer={<>New company? <Link href="/signup" className="font-semibold text-indigo-600">Create a workspace</Link></>}>
      <LoginForm />
    </AuthFrame>
  );
}
