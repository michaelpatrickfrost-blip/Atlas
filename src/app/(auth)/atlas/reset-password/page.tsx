import { AuthFrame } from "@/components/shell/auth-frame";
import { ResetForm } from "@/app/(auth)/reset-password/reset-form";
export default function Page() {
 return <AuthFrame title="Recover Atlas Admin access" subtitle="Use the single-use code provided by your account administrator." footer="Atlas administration"><ResetForm portal="atlas"/></AuthFrame>;
}
