import { requireSession } from "@/core/auth/session";
import { PlanHome } from "@/modules/plan/components/home";

export default async function Page() {
  const session = await requireSession();
  return <PlanHome session={session} />;
}
