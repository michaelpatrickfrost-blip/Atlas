import { Heading, Stats } from "@/components/operations/ui";
import { requireSession } from "@/core/auth/session";
import { QUALITY_CAPABILITIES as C } from "@/core/permissions/capabilities";
import Link from "next/link";
import { qualityToday } from "@/modules/quality/services/queries";
import { StatusPill } from "@/components/ui/status-pill";
import { label } from "@/modules/quality/domain/workflow";

export default async function QualityToday() {
  const session = await requireSession();
  const allow = (cap: string) => session.capabilities.has(cap);
  const {
    activeHolds,
    openNcr,
    criticalNcr,
    overdueActions,
    recentInspections,
    holdCount,
    ncrCount,
    dueCount,
  } = await qualityToday();
  return (
    <div className="space-y-6">
      <Heading
        eyebrow="Quality"
        title="Contain the problem. Follow the fix."
        description="Start with the immediate risk, then give the investigation and corrective action an owner. Retain the evidence and check that the fix worked."
      >
        <Link
          href="/guides/quality"
          className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-blue-600"
        >
          Working guide →
        </Link>
      </Heading>
      <div className="flex flex-wrap gap-3 text-sm">
        {allow(C.ncrReport) && (
          <Link href="/quality/ncr/new" className="atlas-primary-button">
            Report quality issue
          </Link>
        )}
        {allow(C.ncrRead) && (
          <>
            <Link
              href="/quality/ncr"
              className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4"
            >
              Issue register
            </Link>
            <Link
              href="/quality/actions"
              className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4"
            >
              Corrective actions
            </Link>
          </>
        )}
        {allow(C.checkExecute) && (
          <Link
            href="/quality/checks"
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4"
          >
            Run inspection
          </Link>
        )}
      </div>
      <Stats
        items={[
          ...(allow(C.holdRead)
            ? [{ label: "Active holds", value: holdCount }]
            : []),
          ...(allow(C.ncrRead)
            ? [
                { label: "Open issues", value: ncrCount },
                { label: "Critical issues", value: criticalNcr },
                { label: "Actions / reviews due", value: dueCount },
              ]
            : []),
        ]}
      />
      <ol
        aria-label="Quality working process"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {[
          ["Contain", "Identify affected stock and prevent inappropriate use."],
          [
            "Investigate",
            "Record the defect, source, cause and responsible owner.",
          ],
          [
            "Correct",
            "Give each action a due date and record completion evidence.",
          ],
          ["Verify", "Review effectiveness before closing the issue."],
        ].map(([title, detail], i) => (
          <li
            key={title}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <p className="text-xs font-semibold text-blue-600">0{i + 1}</p>
            <h2 className="mt-2 font-semibold">{title}</h2>
            <p className="mt-2 text-xs leading-6 text-slate-500">{detail}</p>
          </li>
        ))}
      </ol>

      {criticalNcr > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {criticalNcr} critical NCR{criticalNcr === 1 ? "" : "s"} open.{" "}
          <Link className="underline" href="/quality/ncr?severity=CRITICAL">
            Review now
          </Link>
        </div>
      )}

      {allow(C.holdRead) && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-600">
            Active quality holds ({holdCount})
          </h3>
          {holdCount > activeHolds.length && (
            <Link className="text-xs text-blue-600" href="/quality/holds">
              Showing the latest {activeHolds.length}; open all holds →
            </Link>
          )}
          {activeHolds.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing on hold.</p>
          ) : (
            <div className="divide-y rounded-2xl border bg-white">
              {activeHolds.map((hold) => (
                <Link
                  key={hold.id}
                  href="/quality/holds"
                  className="flex min-w-0 flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm hover:bg-blue-50/40"
                >
                  <span className="min-w-0 break-words">
                    <span className="font-medium">{hold.number}</span> ·{" "}
                    {hold.product.name} · {Number(hold.quantity)} units
                  </span>
                  <span className="max-w-lg break-words text-xs text-slate-500">
                    {hold.reason}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {allow(C.ncrRead) && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-600">
            Open quality issues ({ncrCount})
          </h3>
          {ncrCount > openNcr.length && (
            <Link className="text-xs text-blue-600" href="/quality/ncr">
              Showing the latest {openNcr.length}; open the issue register →
            </Link>
          )}
          {openNcr.length === 0 ? (
            <p className="text-sm text-slate-500">No open nonconformances.</p>
          ) : (
            <div className="divide-y rounded-2xl border bg-white">
              {openNcr.map((ncr) => (
                <Link
                  key={ncr.id}
                  href={`/quality/ncr/${ncr.id}`}
                  className="flex min-w-0 flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm hover:bg-blue-50/40"
                >
                  <span className="min-w-0 break-words">
                    <span className="font-medium">{ncr.number}</span>{" "}
                    {ncr.title}
                  </span>
                  <StatusPill
                    label={label(ncr.status)}
                    tone={
                      ncr.severity === "CRITICAL"
                        ? "danger"
                        : ncr.status === "OPEN"
                          ? "warning"
                          : "neutral"
                    }
                  />
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {allow(C.ncrRead) && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-600">
            Actions and reviews due ({dueCount})
          </h3>
          {dueCount > overdueActions.length && (
            <Link className="text-xs text-blue-600" href="/quality/actions">
              Showing {overdueActions.length} due actions; open the register →
            </Link>
          )}
          {overdueActions.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing due.</p>
          ) : (
            <div className="divide-y rounded-2xl border bg-white">
              {overdueActions.map((action) => (
                <Link
                  key={action.id}
                  href={`/quality/ncr/${action.ncrId}`}
                  className="flex min-w-0 flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm hover:bg-blue-50/40"
                >
                  <span className="min-w-0 break-words">
                    {action.ncr.number} · {action.description}
                  </span>
                  <span className="text-slate-500">
                    {(action.status === "DONE"
                      ? action.effectivenessReviewDate
                      : action.dueDate
                    )?.toLocaleDateString("en-GB")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {allow(C.checkExecute) && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-600">
            Recent inspections
          </h3>
          {recentInspections.length === 0 ? (
            <p className="text-sm text-slate-500">
              No inspections recorded yet.
            </p>
          ) : (
            <div className="divide-y rounded-2xl border bg-white">
              {recentInspections.map((i) => (
                <Link
                  href={`/quality/checks/${i.id}`}
                  key={i.id}
                  className="flex min-w-0 flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm"
                >
                  <span>
                    {i.number} · {i.product.name}
                  </span>
                  <StatusPill
                    label={label(i.result)}
                    tone={
                      i.result === "FAIL"
                        ? "danger"
                        : i.result === "PASS"
                          ? "success"
                          : "neutral"
                    }
                  />
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
