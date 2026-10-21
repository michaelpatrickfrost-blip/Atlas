import Link from "next/link";
import { Wrench, ArrowRight, Clock3 } from "lucide-react";
import { maintenanceRegister } from "@/modules/maintenance/services/queries";
import { can } from "@/core/permissions/check";
import { CreateDialog } from "@/components/ui/create-dialog";
import {
  Heading,
  Panel,
  Empty,
  Stats,
  Row,
  field,
  quiet,
} from "@/components/operations/ui";
import {
  EquipmentForm,
  MaintenanceWorkForm,
} from "@/modules/maintenance/components/forms";
import { downtimeMinutes } from "@/modules/maintenance/domain/rules";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    q?: string;
    status?: string;
    mine?: string;
    page?: string;
    kind?: string;
  }>;
}) {
  const query = await searchParams,
    data = await maintenanceRegister(query),
    {
      s,
      equipment,
      vehicles,
      people,
      work,
      count,
      page,
      search,
      status,
      stats,
    } = data;
  const assets = query.view === "equipment";
  const href = (updates: Record<string, string>) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...query, ...updates }))
      if (value) params.set(key, value);
    return `/maintenance?${params}`;
  };
  return (
    <div className="space-y-6">
      <Heading
        eyebrow="Maintenance"
        title="Keep your operation running."
        description="See what needs attention, put the right person on the job and keep a useful history for every asset."
      >
        {can(s, "maintenance.work.manage") && (
          <div className="flex flex-wrap gap-2">
            <CreateDialog
              title="Register equipment"
              label="Add equipment"
              variant="secondary"
            >
              <EquipmentForm />
            </CreateDialog>
            <CreateDialog
              title="Create maintenance work"
              label="Create work order"
            >
              <MaintenanceWorkForm
                equipment={equipment}
                vehicles={vehicles.map((vehicle) => ({
                  id: vehicle.id,
                  name: `${vehicle.registration} · ${vehicle.name}`,
                }))}
                people={people}
              />
            </CreateDialog>
          </div>
        )}
      </Heading>
      <Stats
        items={[
          { label: "Open work orders", value: stats.openCount },
          { label: "Urgent / high priority", value: stats.urgentCount },
          { label: "Overdue work", value: stats.overdueCount },
          { label: "Service due", value: stats.dueCount },
        ]}
      />
      <section
        aria-label="Maintenance next actions"
        className="grid gap-3 md:grid-cols-3"
      >
        {[
          {
            title: "Repair or inspect",
            detail: "Record the issue, choose one asset and assign the work.",
            href: "/maintenance?status=open",
            icon: Wrench,
          },
          {
            title: "Plan the next service",
            detail: `${stats.dueCount} assets due for service · ${stats.downCount} out of service.`,
            href: "/maintenance?view=equipment",
            icon: Clock3,
          },
          {
            title: "Follow the working guide",
            detail: "From reporting a breakdown to a verified service history.",
            href: "/guides/maintenance",
            icon: ArrowRight,
          },
        ].map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-5 hover:bg-blue-50"
          >
            <item.icon size={20} className="mt-1 shrink-0 text-blue-600" />
            <div>
              <h2 className="text-sm font-semibold text-slate-800">{item.title}</h2>
              <p className="mt-2 text-xs leading-6 text-slate-500">
                {item.detail}
              </p>
            </div>
          </Link>
        ))}
      </section>
      {!assets && !!data.dueEquipment.length && (
        <Panel title="Servicing needs attention">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.dueEquipment.map((asset) => (
              <Link
                key={asset.id}
                href={`/maintenance/equipment/${asset.id}`}
                className="rounded-xl border border-amber-100 bg-amber-50/40 p-4"
              >
                <p className="text-sm font-semibold text-slate-800">{asset.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {asset.code} · Due{" "}
                  {asset.nextServiceAt?.toLocaleDateString("en-GB", {
                    timeZone: "UTC",
                  })}
                </p>
                <span className="mt-3 inline-block text-xs font-semibold text-blue-600">
                  Open asset & arrange service →
                </span>
              </Link>
            ))}
          </div>
        </Panel>
      )}
      <Panel title={assets ? "Equipment register" : "Maintenance work orders"}>
        <form className="mb-5 grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <input type="hidden" name="view" value={assets ? "equipment" : ""} />
          <label className="text-sm">
            Search
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder={
                assets
                  ? "Name, code or location"
                  : "Work, equipment or registration"
              }
              maxLength={100}
              className={field}
            />
          </label>
          {!assets && (
            <>
              <label className="text-sm">
                Work status
                <select name="status" defaultValue={status} className={field}>
                  {[
                    ["open", "Open work"],
                    ["all", "All work"],
                    ["overdue", "Overdue"],
                    ["OPEN", "Not started"],
                    ["IN_PROGRESS", "In progress"],
                    ["WAITING_PARTS", "Waiting for parts"],
                    ["COMPLETED", "Completed"],
                    ["CANCELLED", "Cancelled"],
                  ].map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Work type
                <select
                  name="kind"
                  defaultValue={query.kind ?? ""}
                  className={field}
                >
                  <option value="">All types</option>
                  {[
                    ["BREAKDOWN", "Breakdown"],
                    ["PREVENTIVE", "Preventive"],
                    ["INSPECTION", "Inspection"],
                    ["REPAIR", "Repair"],
                  ].map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input
                  name="mine"
                  type="checkbox"
                  value="1"
                  defaultChecked={query.mine === "1"}
                />{" "}
                Assigned to me
              </label>
            </>
          )}
          <div className="flex items-center gap-3">
            <button className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white">
              Apply filters
            </button>
            <Link
              className="text-sm text-blue-600"
              href={assets ? "/maintenance?view=equipment" : "/maintenance"}
            >
              Reset
            </Link>
          </div>
        </form>
        <div className="space-y-3">
          {assets
            ? equipment.map((asset) => (
                <Row
                  key={asset.id}
                  href={`/maintenance/equipment/${asset.id}`}
                  title={asset.name}
                  meta={`${asset.code} · ${asset.location || "Location not set"} · Next service ${asset.nextServiceAt?.toLocaleDateString("en-GB", { timeZone: "UTC" }) ?? "not set"}`}
                  status={asset.status}
                />
              ))
            : work.map((item) => (
                <Row
                  key={item.id}
                  href={`/maintenance/work/${item.id}`}
                  title={item.title}
                  meta={`${item.equipment?.name ?? ("vehicle" in item ? (item.vehicle as { name?: string } | null)?.name : null) ?? "Asset"} · ${item.kind.toLowerCase()} · ${item.priority.toLowerCase()} · ${people.find((person) => person.userId === item.assigneeUserId)?.user.name ?? "Unassigned"} · ${item.dueAt ? `Due ${item.dueAt.toLocaleDateString("en-GB", { timeZone: "UTC" })}` : "No due date"}${item.downtimeStartedAt && !item.downtimeEndedAt ? ` · Down ${downtimeMinutes(item.downtimeStartedAt, null)} min` : ""}`}
                  status={item.status}
                />
              ))}
          {!(assets ? equipment.length : work.length) && (
            <Empty>
              {search || query.status || query.mine || query.kind
                ? "No work matches this selection. Clear a filter or try a different name."
                : assets
                  ? "Register the equipment you need to keep running, then attach repairs and service work to its history."
                  : "No open maintenance work. Report a breakdown or plan the next service when needed."}
            </Empty>
          )}
        </div>
        <nav
          aria-label="Register pages"
          className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500"
        >
          <p>
            {count
              ? `${page * 50 + 1}–${Math.min((page + 1) * 50, count)} of ${count}`
              : "0 records"}
          </p>
          <div className="flex gap-3">
            {page > 0 && (
              <Link className={quiet} href={href({ page: String(page - 1) })}>
                Previous
              </Link>
            )}
            {(page + 1) * 50 < count && (
              <Link className={quiet} href={href({ page: String(page + 1) })}>
                Next →
              </Link>
            )}
          </div>
        </nav>
      </Panel>
    </div>
  );
}
