"use client";
import { useActionState, useState, startTransition } from "react";
import { Button } from "@/components/ui/button";
import { importSalescsv } from "@/modules/sales/services/csv-import";

type Entity = "orders" | "quotes";

export function CsvImportExport({ entity, label }: { entity: Entity; label: string }) {
  const [state, action, pending] = useActionState(importSalescsv, { error: "", message: "", preview: [] });
  const [dirty, setDirty] = useState(true);

  const handleDownloadTemplate = async () => {
    const templateEntity = entity === "orders" ? "sales-orders" : "sales-quotes";
    const response = await fetch(`/api/import-template?entity=${templateEntity}`);
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `atlas-${templateEntity}-template.csv`;
      a.click();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Import {label}</h3>
        <p className="text-xs text-[var(--color-ink-muted)] mb-3">
          Download a template, fill in your data, and upload to create {entity} in bulk.
        </p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const button = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
          data.set("entity", entity);
          data.set("mode", button?.value ?? "preview");
          setDirty(false);
          startTransition(() => action(data));
        }}
        onChange={() => setDirty(true)}
        className="space-y-3 rounded-xl border border-[var(--color-border)] bg-white p-4"
      >
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={handleDownloadTemplate} disabled={pending}>
            Download template →
          </Button>
        </div>

        <label className="block text-sm">
          CSV file
          <input
            required
            type="file"
            name="file"
            accept=".csv,text/csv"
            className="mt-2 block w-full rounded-lg border border-[var(--color-border)] p-2 text-sm"
          />
        </label>

        <div className="flex gap-2">
          <Button disabled={pending} name="mode" value="preview" type="submit" variant="secondary">
            Validate & preview
          </Button>
          <Button disabled={pending || dirty || !state.preview.length} name="mode" value="apply" type="submit" variant="primary">
            Import {entity}
          </Button>
        </div>

        {pending && <p className="text-xs text-[var(--color-ink-muted)]">Processing…</p>}
        {state.error && <p className="text-xs text-[var(--color-status-danger)]">{state.error}</p>}
        {state.message && <p className="text-xs text-[var(--color-ink-muted)]">{state.message}</p>}
        {state.preview.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  {Object.keys(state.preview[0]).map((key) => (
                    <th key={key} className="bg-[var(--color-surface-sunken)] p-2 text-left">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.preview.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, column) => (
                      <td key={column} className="border-t border-[var(--color-border)] p-2">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </form>
    </div>
  );
}
