import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { PLAN_CAPABILITIES } from "@/core/permissions/capabilities";
import { CreatePlan } from "@/modules/plan/components/create";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await requireSession();
  assertCapability(session, PLAN_CAPABILITIES.create);
  return <CreatePlan session={session} query={await searchParams} />;
}
