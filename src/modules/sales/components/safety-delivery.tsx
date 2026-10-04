import { getModule } from "@/core/modules/registry";
import Link from "next/link";

export async function SafetyDeliveryNotice({ organisationId, orderId }: { organisationId: string; orderId: string }) {
  const risks = await getModule("safety")?.safetyProvider?.deliveryRisks(organisationId, orderId) ?? [];
  if (!risks.length) return null;
  return (
    <section className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-900">
      <p className="font-medium">Delivery at risk</p>
      <ul className="mt-2 space-y-1">
        {risks.map((risk) => <li key={risk.holdId}><Link href={risk.href} className="underline">{risk.summary}</Link></li>)}
      </ul>
    </section>
  );
}
