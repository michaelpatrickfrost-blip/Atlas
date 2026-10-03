import type { ReactNode } from "react";

export type Column<Row> = {
  header: string;
  render: (row: Row) => ReactNode;
  align?: "left" | "right";
  width?: string;
};

/** The standard Atlas table: dense, readable, borders over shadows. Row click
 *  navigates via `getHref`; keep per-row actions to a single overflow trigger
 *  rather than permanent buttons (see docs/DESIGN_SYSTEM.md §Tables). */
export function DataTable<Row extends { id: string }>(props: {
  columns: Column<Row>[];
  rows: Row[];
  getHref?: (row: Row) => string;
  emptyLabel?: string;
}) {
  const { columns, rows, getHref, emptyLabel = "Nothing here yet." } = props;
  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-[var(--radius-atlas-md)] border border-[var(--color-border)] bg-[var(--color-surface)] py-14 text-sm text-[var(--color-ink-muted)]">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-atlas-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-sunken)]">
            {columns.map((column) => (
              <th
                key={column.header}
                style={{ width: column.width }}
                className={`px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-faint)] ${column.align === "right" ? "text-right" : "text-left"}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const href = getHref?.(row);
            return (
              <tr key={row.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-sunken)]">
                {columns.map((column, index) => (
                  <td key={column.header} className={`px-4 py-3 text-[var(--color-ink)] ${column.align === "right" ? "text-right" : "text-left"}`}>
                    {index === 0 && href ? (
                      <a href={href} className="block focus-visible:outline-2 focus-visible:outline-[var(--color-atlas-blue)]">
                        {column.render(row)}
                      </a>
                    ) : (
                      column.render(row)
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
