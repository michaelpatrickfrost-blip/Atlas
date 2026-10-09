import Link from "next/link";
import { ResetForm } from "@/app/(auth)/reset-password/reset-form";
import { AdminAuthFrame } from "@/components/admin/auth-frame";
import { ADMIN_LOGIN_PATH } from "@/core/auth/admin-address";

export default function Page() {
  return <AdminAuthFrame title="Recover access" subtitle="Enter the single-use code provided by your Atlas administrator." footer={<Link href={ADMIN_LOGIN_PATH} className="font-medium text-blue-700">Back to sign in</Link>}><ResetForm portal="atlas" loginHref={ADMIN_LOGIN_PATH} /></AdminAuthFrame>;
}
