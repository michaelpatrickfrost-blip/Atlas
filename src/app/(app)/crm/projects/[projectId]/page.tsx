import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { getSalesProject } from "@/modules/crm/services/sales-projects-queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function SalesProjectDetailPage({ params }: Props) {
  const { projectId } = await params;
  const session = await requireSession();
  await assertCapability(session, SALES_CAPABILITIES.opportunityRead);

  const project = await getSalesProject(projectId, session.organisationId);
  if (!project) {
    notFound();
  }

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
      {/* Header */}
      <div>
        <Link
          href="/crm/projects"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold">{project.reference}</h1>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${stageColors[project.stage] || "bg-gray-100"}`}>
                {project.stage}
              </span>
            </div>
            <h2 className="text-xl text-gray-600">{project.name}</h2>
          </div>
          <Button variant="secondary">Edit</Button>
        </div>
      </div>

      {/* Compact Metrics */}
      <div className="grid grid-cols-5 gap-4">
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-600 uppercase">Potential</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {formatCurrency(project.potentialValueAmount, project.potentialValueCurrency)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-600 uppercase">Quoted</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {formatCurrency(project.quotedValueAmount, project.quotedValueCurrency)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-600 uppercase">Awarded</p>
          <p className="text-lg font-semibold text-green-700 mt-1">
            {formatCurrency(project.awardedValueAmount, project.awardedValueCurrency)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-600 uppercase">Ordered</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {formatCurrency(project.orderedValueAmount, project.orderedValueCurrency)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-600 uppercase">Remaining</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {formatCurrency(project.remainingValueAmount, project.remainingValueCurrency)}
          </p>
        </div>
      </div>

      {/* Key Dates */}
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Key Dates</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase">Target Award</p>
            <p className="text-sm text-gray-900 mt-1">
              {project.targetAwardDate
                ? new Date(project.targetAwardDate).toLocaleDateString()
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase">Expected Start</p>
            <p className="text-sm text-gray-900 mt-1">
              {project.expectedStartDate
                ? new Date(project.expectedStartDate).toLocaleDateString()
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase">Expected Completion</p>
            <p className="text-sm text-gray-900 mt-1">
              {project.expectedCompletionDate
                ? new Date(project.expectedCompletionDate).toLocaleDateString()
                : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column */}
      <div className="grid grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="col-span-2 space-y-6">
          {/* Organisations */}
          <div className="rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Organisations</h3>
              <Button variant="secondary" className="gap-2 text-sm px-3 py-2">
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>
            {project.organisations.length === 0 ? (
              <p className="text-sm text-gray-600">No organisations yet</p>
            ) : (
              <div className="space-y-3">
                {project.organisations.map((org) => (
                  <div key={org.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{org.party.name}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {org.roles.join(", ")}
                      </p>
                    </div>
                    {org.isPrimary && (
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-900 border border-blue-200">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stakeholders */}
          <div className="rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Stakeholders</h3>
              <Button variant="secondary" className="gap-2 text-sm px-3 py-2">
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>
            {project.stakeholders.length === 0 ? (
              <p className="text-sm text-gray-600">No stakeholders yet</p>
            ) : (
              <div className="space-y-3">
                {project.stakeholders.map((sh) => (
                  <div key={sh.id} className="p-3 border border-gray-200 rounded">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {sh.contact.firstName} {sh.contact.surname}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {sh.contact.jobTitle || "No title"}
                        </p>
                        <p className="text-xs text-gray-600">
                          {sh.contact.party?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quotes */}
          <div className="rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Quotes</h3>
              <Button variant="secondary" className="gap-2 text-sm px-3 py-2">
                <Plus className="w-4 h-4" />
                New
              </Button>
            </div>
            {project.quotes.length === 0 ? (
              <p className="text-sm text-gray-600">No quotes yet</p>
            ) : (
              <div className="space-y-2">
                {project.quotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50"
                  >
                    <Link href={`/sales/quotes/${quote.id}`} className="flex-1">
                      <p className="text-sm font-medium text-blue-600">{quote.reference}</p>
                    </Link>
                    <span className="inline-block px-2 py-1 rounded text-xs font-medium border border-gray-300 bg-white">
                      {quote.status}
                    </span>
                    <p className="text-sm font-medium text-gray-900 ml-4">
                      {formatCurrency(quote.totalAmount, quote.totalCurrency)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Orders */}
          <div className="rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Orders</h3>
            {project.orders.length === 0 ? (
              <p className="text-sm text-gray-600">No orders yet</p>
            ) : (
              <div className="space-y-2">
                {project.orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50"
                  >
                    <Link href={`/sales/orders/${order.id}`} className="flex-1">
                      <p className="text-sm font-medium text-blue-600">{order.reference}</p>
                    </Link>
                    <span className="inline-block px-2 py-1 rounded text-xs font-medium border border-gray-300 bg-white">
                      {order.commercialStatus}
                    </span>
                    <p className="text-sm font-medium text-gray-900 ml-4">
                      {formatCurrency(order.grossAmount, order.currency)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Next Action */}
          <div className="rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Next Action</h3>
            <p className="text-sm text-gray-700">
              {project.nextActionNote || "No next action set"}
            </p>
            {project.nextActionAt && (
              <p className="text-xs text-gray-600 mt-2">
                Due: {new Date(project.nextActionAt).toLocaleDateString()}
              </p>
            )}
            <Button variant="secondary" className="w-full mt-4 text-sm px-3 py-2">
              Update
            </Button>
          </div>

          {/* Description */}
          {project.description && (
            <div className="rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-700">{project.description}</p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Owner</span>
                <span className="font-medium text-gray-900">{project.team?.name || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Probability</span>
                <span className="font-medium text-gray-900">
                  {project.probability ? `${project.probability}%` : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Industry</span>
                <span className="font-medium text-gray-900">
                  {project.industry?.name || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created</span>
                <span className="font-medium text-gray-900">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
