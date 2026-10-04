import { LoginForm } from "@/app/(auth)/login/login-form";
import { AuthFrame } from "@/components/shell/auth-frame";

export default function LoginPage() {
  return (
    <AuthFrame title="Sign in" footer="Company accounts are set up by Atlas. Your first sign-in uses the setup code you were given.">
      <LoginForm />
    </AuthFrame>
  );
}
