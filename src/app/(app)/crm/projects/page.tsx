import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { listSalesProjects } from "@/modules/crm/services/sales-projects-queries";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function SalesProjectsPage() {
  const session = await requireSession();
  await assertCapability(session, SALES_CAPABILITIES.opportunityRead);

  const projects = await listSalesProjects(session.organisationId, {
    limit: 100,
  });

  const formatCurrency = (amount: number | null | undefined, currency = "GBP") => {
    if (!amount) return "-";
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  const stageColors: Record<string, string> = {
    IDENTIFIED: "bg-slate-100 text-slate-900",
    QUALIFIED: "bg-blue-100 text-blue-900",
    SPECIFICATION: "bg-cyan-100 text-cyan-900",
    ESTIMATING: "bg-indigo-100 text-indigo-900",
    QUOTING: "bg-purple-100 text-purple-900",
    NEGOTIATION: "bg-violet-100 text-violet-900",
    PREFERRED: "bg-yellow-100 text-yellow-900",
    AWARDED: "bg-green-100 text-green-900",
    LIVE: "bg-emerald-100 text-emerald-900",
    COMPLETED: "bg-gray-100 text-gray-900",
    LOST: "bg-red-100 text-red-900",
    CANCELLED: "bg-orange-100 text-orange-900",
    DORMANT: "bg-slate-50 text-slate-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sales Projects</h1>
          <p className="text-sm text-gray-600 mt-1">
            {projects.length} active project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/crm/projects/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <h3 className="font-medium text-gray-900">No sales projects yet</h3>
          <p className="text-sm text-gray-600 mt-1">
            Create one to start tracking complex, multi-organisation deals.
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Project</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Stage</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Potential</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Awarded</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Orgs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/crm/projects/${project.id}`}
                      className="block text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {project.reference}
                      <div className="text-xs text-gray-600 mt-1">{project.name}</div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {project.team?.name || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        stageColors[project.stage] || "bg-gray-100"
                      }`}
                    >
                      {project.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(project.potentialValueAmount, project.potentialValueCurrency)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-green-700">
                    {formatCurrency(project.awardedValueAmount, project.awardedValueCurrency)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-medium text-gray-600">
                      {project.organisations.length}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
