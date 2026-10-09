"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Clock3,
  CheckCircle2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Users,
  List,
  CalendarRange,
  StickyNote,
} from "lucide-react";
import { WorkspaceHeading, WorkspaceStats } from "@/components/ui/workspace";
import { CreateDialog } from "@/components/ui/create-dialog";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import {
  saveAppointmentForm as saveAppointment,
  finishAppointmentForm,
} from "../services/appointments";
import {
  APPOINTMENT_TYPES,
  appointmentDay,
  appointmentInstant,
  appointmentLocalInput,
} from "../domain/appointments";

type Choice = { id: string; name: string };
export type AppointmentRow = {
  id: string;
  subject: string;
  type: string;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  notes: string | null;
  outcome: string | null;
  version: number;
  ownerUserId: string;
  ownerName: string;
  completed: boolean;
  cancelled: boolean;
  partyId: string | null;
  prospectId: string | null;
  opportunityId: string | null;
  accountName: string;
  accountHref: string | null;
  dealName: string | null;
};
type DiaryProps = {
  rows: AppointmentRow[];
  days: string[];
  query: {
    week?: string;
    q?: string;
    state?: string;
    owner?: string;
    party?: string;
    focus?: string;
  };
  customers: Choice[];
  prospects: Choice[];
  deals: (Choice & { partyId: string })[];
  owners: Choice[];
  userId: string;
  canManage: boolean;
  seesAll: boolean;
  requestKey: string;
  truncated: boolean;
};
const field =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800";
const time = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
const words = (value: string) => value.toLowerCase().replaceAll("_", " ");

export function AppointmentDiary(props: DiaryProps) {
  const { rows, days, query, canManage, seesAll } = props;
  const [view, setView] = useState("agenda"),
    [selectedId, setSelectedId] = useState(query.focus ?? "");
  const selected = rows.find((row) => row.id === selectedId);
  function weekLink(offset: number) {
    const date = new Date(`${days[0]}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + offset);
    return `?${new URLSearchParams({ ...query, week: date.toISOString().slice(0, 10), focus: "" })}`;
  }
  return (
    <div className="min-w-0 space-y-5">
      <WorkspaceHeading
        eyebrow="Sales diary"
        title="Appointments that move sales forward"
        description="Plan calls, visits and demos. Keep preparation, outcomes and follow-ups connected to the account and deal. Times are shown in Europe/London."
        actions={
          canManage && (
            <CreateDialog
              title="Schedule a sales appointment"
              label="New appointment"
            >
              <AppointmentEditor {...props} />
            </CreateDialog>
          )
        }
      />
      <WorkspaceStats
        items={[
          {
            label: "Appointments",
            value: rows.length,
            hint: "In this week and view",
            icon: CalendarDays,
          },
          {
            label: "Customers & prospects",
            value: new Set(rows.map((row) => row.partyId || row.prospectId))
              .size,
            hint: "Relationships on the diary",
            icon: Users,
          },
          {
            label: "With a deal",
            value: rows.filter((row) => row.opportunityId).length,
            hint: "Linked to the pipeline",
            icon: CalendarRange,
          },
          {
            label: "Completed",
            value: rows.filter((row) => row.completed).length,
            hint: "Use Completed to review outcomes",
            icon: CheckCircle2,
          },
        ]}
      />
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <form className="flex flex-wrap gap-3">
          <input type="hidden" name="week" value={days[0]} />
          {query.party && (
            <input name="party" type="hidden" value={query.party} />
          )}
          <input
            type="search"
            name="q"
            aria-label="Search appointments"
            defaultValue={query.q}
            placeholder="Search appointments"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
          <select
            name="state"
            aria-label="Appointment status"
            defaultValue={query.state ?? "planned"}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          >
            <option value="planned">Planned</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {seesAll && (
            <select
              name="owner"
              aria-label="Salesperson"
              defaultValue={query.owner ?? ""}
              className="max-w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="">All salespeople</option>
              {props.owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name}
                </option>
              ))}
            </select>
          )}
          <Button type="submit" variant="secondary">
            Apply
          </Button>
        </form>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={weekLink(-7)}
            aria-label="Previous week"
            className="rounded-lg border border-slate-200 bg-white p-2"
          >
            <ChevronLeft size={17} />
          </Link>
          <p className="text-sm font-semibold">
            {new Date(`${days[0]}T12:00:00Z`).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}{" "}
            –{" "}
            {new Date(`${days[6]}T12:00:00Z`).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
          <Link
            href={weekLink(7)}
            aria-label="Next week"
            className="rounded-lg border border-slate-200 bg-white p-2"
          >
            <ChevronRight size={17} />
          </Link>
          <Link
            href="/crm/appointments"
            className="text-xs font-medium text-blue-600"
          >
            This week
          </Link>
        </div>
        <div className="flex rounded-xl border border-slate-200 bg-white p-1">
          {(
            [
              ["week", "Week", CalendarDays],
              ["agenda", "Agenda", List],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={String(value)}
              type="button"
              aria-pressed={view === value}
              onClick={() => setView(String(value))}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${view === value ? "bg-blue-50 text-blue-700" : "text-slate-500"}`}
            >
              <Icon size={15} />
              {String(label)}
            </button>
          ))}
        </div>
      </div>
      <div className="min-w-0 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
        {view === "week" ? (
          <div className="grid min-w-[1120px] grid-cols-7 gap-2">
            {days.map((day) => {
              const items = rows.filter(
                (row) => appointmentDay(row.startsAt) === day,
              );
              return (
                <section key={day} className="min-h-64 rounded-xl bg-white p-3">
                  <p className="text-xs font-semibold text-slate-400">
                    {new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", {
                      weekday: "short",
                    })}
                  </p>
                  <p className="mt-1 text-xl font-semibold text-slate-800">
                    {Number(day.slice(-2))}
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      {items.length ? `${items.length} booked` : "Free"}
                    </span>
                  </p>
                  <div className="mt-4 space-y-2">
                    {items.map((row) => (
                      <AppointmentCard
                        key={row.id}
                        row={row}
                        selected={selectedId === row.id}
                        onSelect={() => setSelectedId(row.id)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3 p-2">
            {days
              .filter((day) =>
                rows.some((row) => appointmentDay(row.startsAt) === day),
              )
              .map((day) => (
                <section key={day}>
                  <h3 className="mb-2 text-xs font-semibold text-slate-500">
                    {new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", {
                      weekday: "long",
                      day: "numeric",
                      month: "short",
                    })}
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {rows
                      .filter((row) => appointmentDay(row.startsAt) === day)
                      .map((row) => (
                        <AppointmentCard
                          key={row.id}
                          row={row}
                          selected={selectedId === row.id}
                          onSelect={() => setSelectedId(row.id)}
                        />
                      ))}
                  </div>
                </section>
              ))}
            {!rows.length && (
              <p className="py-10 text-center text-sm text-slate-500">
                No appointments in this view. Choose another week or schedule
                your next conversation.
              </p>
            )}
          </div>
        )}
      </div>
      {props.truncated && (
        <p className="text-xs text-amber-700">
          The diary has reached its 500-record limit. Filter by salesperson or
          account.
        </p>
      )}
      {selected && (
        <section
          key={`${selected.id}:${selected.version}`}
          className="rounded-2xl border border-blue-200 bg-white p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Appointment details
              </p>
              <h3 className="mt-2 text-xl font-semibold">{selected.subject}</h3>
              {selected.accountHref ? (
                <Link
                  href={selected.accountHref}
                  className="mt-1 block text-sm font-medium text-blue-600"
                >
                  {selected.accountName} →
                </Link>
              ) : (
                <p className="mt-1 text-sm text-slate-500">
                  {selected.accountName}
                </p>
              )}
              <p className="mt-2 text-xs text-slate-500">
                {selected.ownerName}
                {selected.dealName ? ` · ${selected.dealName}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedId("")}
              className="text-xs text-slate-500"
            >
              Close details
            </button>
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="space-y-4">
              <p className="flex items-center gap-2 text-sm text-slate-600">
                <Clock3 size={16} />
                {new Date(selected.startsAt).toLocaleDateString("en-GB", {
                  timeZone: "Europe/London",
                  day: "numeric",
                  month: "long",
                })}{" "}
                · {time(selected.startsAt)}
                {selected.endsAt ? ` – ${time(selected.endsAt)}` : ""}
              </p>
              {selected.location && (
                <p className="flex items-center gap-2 break-words text-sm text-slate-600">
                  <MapPin size={16} />
                  {selected.location}
                </p>
              )}
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <StickyNote size={14} />
                  Preparation & notes
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">
                  {selected.notes || "No preparation notes yet."}
                </p>
              </div>
              {selected.outcome && (
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs font-semibold text-emerald-700">
                    Outcome
                  </p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm">
                    {selected.outcome}
                  </p>
                </div>
              )}
              {canManage && !selected.completed && !selected.cancelled && (
                <ActionForm
                  action={async (form) => {
                    const result = await finishAppointmentForm(form);
                    if (result.error) throw new Error(result.error);
                  }}
                  className="space-y-3"
                >
                  <input name="id" type="hidden" value={selected.id} />
                  <input
                    name="version"
                    type="hidden"
                    value={selected.version}
                  />
                  <label className="block text-xs font-medium">
                    Outcome / next step
                    <textarea
                      name="outcome"
                      required
                      maxLength={3000}
                      rows={3}
                      className={field}
                    />
                  </label>
                  <Button type="submit" variant="primary">
                    <CheckCircle2 size={15} />
                    Mark completed
                  </Button>
                  <Button
                    type="submit"
                    name="cancel"
                    value="yes"
                    formNoValidate
                    variant="ghost"
                  >
                    Cancel appointment
                  </Button>
                </ActionForm>
              )}
            </div>
            {canManage && !selected.completed && !selected.cancelled && (
              <details className="rounded-xl border border-slate-200 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-blue-700">
                  Reschedule or edit
                </summary>
                <div className="mt-4">
                  <AppointmentEditor {...props} row={selected} />
                </div>
              </details>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
function AppointmentCard({
  row,
  selected,
  onSelect,
}: {
  row: AppointmentRow;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-3 text-left transition-colors ${selected ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-blue-300"}`}
    >
      <span className="block text-xs font-semibold text-blue-600">
        {time(row.startsAt)}
        {row.endsAt ? ` – ${time(row.endsAt)}` : ""}
      </span>
      <span className="mt-2 block break-words text-sm font-semibold text-slate-800">
        {row.subject}
      </span>
      <span className="mt-1 block truncate text-xs text-slate-500">
        {row.accountName}
      </span>
      <span className="mt-3 inline-block rounded-md bg-slate-100 px-2 py-1 text-[10px] capitalize text-slate-500">
        {row.cancelled
          ? "Cancelled"
          : row.completed
            ? "Completed"
            : words(row.type)}
      </span>
    </button>
  );
}
function AppointmentEditor(props: DiaryProps & { row?: AppointmentRow }) {
  const { row, customers, prospects, deals, owners, userId, requestKey } =
    props;
  const [target, setTarget] = useState(
    row?.partyId
      ? `party:${row.partyId}`
      : row?.prospectId
        ? `prospect:${row.prospectId}`
        : props.query.party
          ? `party:${props.query.party}`
          : "",
  );
  const [key, setKey] = useState(requestKey),
    [pending, start] = useTransition(),
    [message, setMessage] = useState(""),
    [error, setError] = useState(false);
  const router = useRouter();
  const partyId = target.startsWith("party:") ? target.slice(6) : "",
    prospectId = target.startsWith("prospect:") ? target.slice(9) : "";
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (pending) return;
        const form = event.currentTarget,
          data = new FormData(form);
        start(async () => {
          setMessage("");
          setError(false);
          try {
            data.set(
              "startsAt",
              appointmentInstant(String(data.get("startsAt"))),
            );
            data.set("endsAt", appointmentInstant(String(data.get("endsAt"))));
            const result = await saveAppointment(data);
            if (result.error) throw new Error(result.error);
            setMessage(row ? "Appointment updated." : "Appointment scheduled.");
            if (!row) {
              form.reset();
              setTarget("");
              setKey(crypto.randomUUID());
            }
            router.refresh();
          } catch (caught) {
            setError(true);
            setMessage(
              caught instanceof Error
                ? caught.message
                : "Could not save this appointment.",
            );
          }
        });
      }}
    >
      <fieldset disabled={pending} className="space-y-4">
        <input name="id" type="hidden" value={row?.id ?? ""} />
        <input name="version" type="hidden" value={row?.version ?? 1} />
        <input name="requestKey" type="hidden" value={key} />
        <input name="partyId" type="hidden" value={partyId} />
        <input name="prospectId" type="hidden" value={prospectId} />
        <label className="block text-xs font-medium">
          Appointment title
          <input
            name="subject"
            required
            maxLength={300}
            defaultValue={row?.subject}
            placeholder="e.g. Discuss the next order"
            className={field}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium">
            Type
            <select
              name="type"
              defaultValue={row?.type ?? "MEETING"}
              className={field}
            >
              {APPOINTMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {words(type)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium">
            Salesperson
            <select
              name="ownerUserId"
              defaultValue={row?.ownerUserId ?? userId}
              className={field}
            >
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-xs font-medium">
          Customer or prospect
          <select
            aria-label="Appointment account"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            required
            className={field}
          >
            <option value="">Choose an account</option>
            <optgroup label="Customers">
              {customers.map((customer) => (
                <option key={customer.id} value={`party:${customer.id}`}>
                  {customer.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Prospects">
              {prospects.map((prospect) => (
                <option key={prospect.id} value={`prospect:${prospect.id}`}>
                  {prospect.name}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        <label className="block text-xs font-medium">
          Deal (optional)
          <select
            key={target}
            name="opportunityId"
            defaultValue={
              row?.partyId === partyId ? (row?.opportunityId ?? "") : ""
            }
            className={field}
          >
            <option value="">No linked deal</option>
            {deals
              .filter((deal) => deal.partyId === partyId)
              .map((deal) => (
                <option key={deal.id} value={deal.id}>
                  {deal.name}
                </option>
              ))}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium">
            Starts · London time
            <input
              name="startsAt"
              type="datetime-local"
              required
              defaultValue={
                row
                  ? appointmentLocalInput(row.startsAt)
                  : `${props.days[0]}T09:00`
              }
              className={field}
            />
          </label>
          <label className="block text-xs font-medium">
            Ends · London time
            <input
              name="endsAt"
              type="datetime-local"
              required
              defaultValue={
                row
                  ? appointmentLocalInput(
                      row.endsAt ??
                        new Date(
                          new Date(row.startsAt).getTime() + 1800000,
                        ).toISOString(),
                    )
                  : `${props.days[0]}T09:30`
              }
              className={field}
            />
          </label>
        </div>
        <label className="block text-xs font-medium">
          Location or meeting link
          <input
            name="location"
            maxLength={500}
            defaultValue={row?.location ?? ""}
            placeholder="Customer site, phone or video link"
            className={field}
          />
        </label>
        <label className="block text-xs font-medium">
          Preparation & notes
          <textarea
            name="notes"
            maxLength={10000}
            rows={3}
            defaultValue={row?.notes ?? ""}
            className={field}
          />
        </label>
        <Button type="submit" variant="primary">
          {pending ? "Saving…" : row ? "Save changes" : "Schedule appointment"}
        </Button>
      </fieldset>
      {message && (
        <p
          role={error ? "alert" : "status"}
          className={`text-sm ${error ? "text-rose-700" : "text-emerald-700"}`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
