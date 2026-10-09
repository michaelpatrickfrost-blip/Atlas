import { LoginForm } from "@/app/(auth)/login/login-form";
import { AuthFrame } from "@/components/shell/auth-frame";
export default function Page() {
  return <AuthFrame title="Atlas Admin sign in" subtitle="Staff access to company setup and platform administration." footer="Business users sign in through their own company's address."><LoginForm portal="atlas"/></AuthFrame>;
}
