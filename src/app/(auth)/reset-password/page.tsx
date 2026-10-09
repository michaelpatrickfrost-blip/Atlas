import Link from "next/link";
import { AuthFrame } from "@/components/shell/auth-frame";
import { ResetForm } from "./reset-form";

export const metadata = { title: "Set your Atlas password", referrer: "no-referrer" };

export default async function PasswordRecovery({searchParams}:{searchParams:Promise<{portal?:string}>}) {
  const portal=(await searchParams).portal === "atlas" ? "atlas" : undefined;
  return (
    <AuthFrame title="Set your password" subtitle="Enter the setup or recovery code you were given. A code works once and expires after 30 minutes." footer={<Link className="text-[#0071e3]" href={portal ? "/atlas/login" : "/login"}>Back to sign in</Link>}>
      <ResetForm portal={portal}/>
    </AuthFrame>
  );
}
