import { LoginForm } from "@/app/(auth)/login/login-form";
import { AdminAuthFrame } from "@/components/admin/auth-frame";
import { ADMIN_RECOVERY_PATH } from "@/core/auth/admin-address";

export default function Page() {
  return <AdminAuthFrame title="Admin sign in" subtitle="Access company accounts, people and platform settings."><LoginForm portal="atlas" recoveryHref={ADMIN_RECOVERY_PATH} /></AdminAuthFrame>;
}
