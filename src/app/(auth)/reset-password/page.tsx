import Link from "next/link";
import { AuthFrame } from "@/components/shell/auth-frame";
import { redirect } from "next/navigation";
import { ResetForm } from "./reset-form";

export const metadata = { title: "Set your Atlas password", referrer: "no-referrer" };

export default async function PasswordRecovery({searchParams}:{searchParams:Promise<{portal?:string}>}) {
  if ((await searchParams).portal === "atlas") redirect("/atlas/reset-password");
  return (
    <AuthFrame title="Set your password" subtitle="Enter the setup or recovery code you were given. A code works once and expires after 30 minutes." footer={<Link className="text-[#0071e3]" href="/login">Back to sign in</Link>}>
      <ResetForm/>
    </AuthFrame>
  );
}
