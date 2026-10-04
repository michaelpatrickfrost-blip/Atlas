import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { QUALITY_CAPABILITIES } from "@/core/permissions/capabilities";
import { requireSpecification } from "@/modules/quality/services/queries";
import { setSpecificationStatus } from "@/modules/quality/services/commands";
import { StatusPill } from "@/components/ui/status-pill";
import { label } from "@/modules/quality/domain/workflow";

export default async function SpecificationDetail({ params }: { params: Promise<{ specId: string }> }) {
  const { specId } = await params;
  const session = await requireSession();
  assertCapability(session, QUALITY_CAPABILITIES.specRead);
  const spec = await requireSpecification(session, specId);
  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{spec.code} / {spec.revision}</h2>
          <p className="text-sm text-slate-500">{spec.title} · {spec.product.name}</p>
        </div>
        <StatusPill label={label(spec.status)} tone={spec.status === "EFFECTIVE" ? "success" : spec.status === "SUPERSEDED" ? "neutral" : "warning"} />
      </div>

      <section className="rounded-2xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="px-4 py-2">Characteristic</th><th className="px-4 py-2">Method</th><th className="px-4 py-2">Target</th><th className="px-4 py-2">Lower</th><th className="px-4 py-2">Upper</th></tr>
          </thead>
          <tbody className="divide-y">
            {spec.characteristics.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2">{c.name}</td>
                <td className="px-4 py-2">{label(c.method)}</td>
                <td className="px-4 py-2">{c.target?.toString() ?? "—"} {c.unit ?? ""}</td>
                <td className="px-4 py-2">{c.lowerLimit?.toString() ?? "—"}</td>
                <td className="px-4 py-2">{c.upperLimit?.toString() ?? "—"}</td>
              </tr>
            ))}
            {spec.characteristics.length === 0 && <tr><td className="px-4 py-3 text-slate-500" colSpan={5}>No characteristics recorded.</td></tr>}
          </tbody>
        </table>
      </section>

      {session.capabilities.has(QUALITY_CAPABILITIES.specManage) && spec.status === "DRAFT" && (
        <form action={setSpecificationStatus}>
          <input type="hidden" name="specificationId" value={spec.id} />
          <input type="hidden" name="status" value="EFFECTIVE" />
          <button className="atlas-primary-button">Make effective</button>
        </form>
      )}
    </div>
  );
}
