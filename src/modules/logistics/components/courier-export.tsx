"use client";

import { useMemo, useState } from "react";
import { COURIER_COLUMNS, DEFAULT_COURIER_COLUMNS } from "@/modules/logistics/domain/handling";

export function CourierExport({ shipments }: { shipments: Array<{ id: string; reference: string }> }) {
  const [columns, setColumns] = useState<string[]>([...DEFAULT_COURIER_COLUMNS]);
  const [ids, setIds] = useState<string[]>(shipments.map((shipment) => shipment.id));
  const href = useMemo(() => {
    const params = new URLSearchParams({ ids: ids.join(","), columns: columns.join(",") });
    return `/api/logistics/courier?${params.toString()}`;
  }, [columns, ids]);

  function toggle(list: string[], value: string, checked: boolean) {
    return checked ? [...list, value] : list.filter((item) => item !== value);
  }

  return (
    <section className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-white p-5">
      <div>
        <h2 className="text-lg font-semibold">Courier file</h2>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Choose the shipments and the columns, then download a CSV for the carrier.</p>
      </div>
      {shipments.length > 1 && (
        <div className="flex flex-wrap gap-3 text-sm">
          {shipments.map((shipment) => (
            <label key={shipment.id} className="flex items-center gap-2">
              <input type="checkbox" checked={ids.includes(shipment.id)} onChange={(event) => setIds(toggle(ids, shipment.id, event.target.checked))} />
              {shipment.reference}
            </label>
          ))}
        </div>
      )}
      <div className="grid gap-2 sm:grid-cols-3">
        {COURIER_COLUMNS.map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={columns.includes(key)} onChange={(event) => setColumns(toggle(columns, key, event.target.checked))} />
            {label}
          </label>
        ))}
      </div>
      <a href={ids.length && columns.length ? href : undefined} className={`inline-block rounded-full px-4 py-2 text-sm font-semibold text-white ${ids.length && columns.length ? "bg-[var(--color-atlas-blue)]" : "pointer-events-none bg-slate-300"}`}>Download CSV</a>
    </section>
  );
}
