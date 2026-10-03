import Link from "next/link";
import { AuthFrame } from "@/components/shell/auth-frame";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <AuthFrame title="Your business starts here." subtitle="Create a private Atlas workspace for your team." footer={<>Already have an account? <Link href="/login" className="font-semibold text-indigo-600">Sign in</Link></>}>
      <div className="rounded-[28px] border border-white bg-white p-6 shadow-[var(--shadow-atlas-lg)]"><SignupForm /></div>
    </AuthFrame>
  );
}
